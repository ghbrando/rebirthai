import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getUserOrNull } from "@/lib/auth";
import { aiConfigured, getAnthropic } from "@/lib/ai/client";
import { coachModel, logAiUsage } from "@/lib/ai/usage";
import { DRAFT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getTestimonyById, loadHistory, transcript } from "@/lib/ai/coach-data";
import { DraftOutputSchema, toTestimonyContent } from "@/lib/ai/content";
import type { DraftRequest, DraftResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({ testimonyId: z.string().min(1) });

/** POST /api/coach/draft: builds a draft only from the author's own answers (US-05, RC-04). */
export async function POST(req: Request) {
  const auth = await getUserOrNull();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsedBody = Body.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { testimonyId } = parsedBody.data satisfies DraftRequest;

  const testimony = await getTestimonyById(auth.supabase, testimonyId);
  if (!testimony) return Response.json({ error: "Not found" }, { status: 404 });
  if (!aiConfigured()) {
    return Response.json({ error: "The coach is not configured yet (missing ANTHROPIC_API_KEY)." }, { status: 503 });
  }

  const history = await loadHistory(auth.supabase, testimony.id);
  if (!history.some((m) => m.role === "user")) {
    return Response.json({ error: "Share a bit of your story with the coach first." }, { status: 422 });
  }

  try {
    const msg = await getAnthropic().messages.parse({
      model: coachModel("draft"),
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: zodOutputFormat(DraftOutputSchema) },
      system: [{ type: "text", text: DRAFT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Here is the interview transcript. Write the testimony draft from the AUTHOR's words only.\n\n<transcript>\n${transcript(history)}\n</transcript>`,
        },
      ],
    });
    logAiUsage("draft", msg.model, msg.usage, testimony.id);
    if (msg.stop_reason === "refusal" || !msg.parsed_output) {
      return Response.json({ error: "Couldn't create a draft this time. Please try again." }, { status: 502 });
    }
    const content = toTestimonyContent(msg.parsed_output.blocks);
    const title = msg.parsed_output.title.trim().slice(0, 120) || "My Testimony";

    const { error } = await auth.supabase
      .from("testimonies")
      .update({ title, draft_content: content, updated_at: new Date().toISOString() })
      .eq("id", testimony.id);
    if (error) return Response.json({ error: "Could not save draft" }, { status: 500 });

    const res: DraftResponse = { title, content };
    return Response.json(res);
  } catch (err) {
    console.error("draft error", err);
    return Response.json({ error: "Couldn't create a draft this time. Please try again." }, { status: 502 });
  }
}
