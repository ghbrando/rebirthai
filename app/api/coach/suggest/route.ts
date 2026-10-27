import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getUserOrNull } from "@/lib/auth";
import { aiConfigured, getAnthropic } from "@/lib/ai/client";
import { coachModel, logAiUsage } from "@/lib/ai/usage";
import { SUGGEST_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { blockText, getTestimonyById, loadHistory, transcript } from "@/lib/ai/coach-data";
import type { CoachSuggestion, SuggestResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  testimonyId: z.string().min(1),
  instruction: z.string().min(1).max(1000),
});

const Output = z.object({
  suggestions: z.array(
    z.object({
      blockIndex: z.number(),
      original: z.string(),
      proposed: z.string(),
      reason: z.string(),
    }),
  ),
  note: z.string(),
});

/**
 * POST /api/coach/suggest: returns PROPOSED edits only. It never writes to the
 * draft (RC-04, US-06); the editor applies accepted suggestions.
 */
export async function POST(req: Request) {
  const auth = await getUserOrNull();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const testimony = await getTestimonyById(auth.supabase, body.data.testimonyId);
  if (!testimony) return Response.json({ error: "Not found" }, { status: 404 });
  if (!aiConfigured()) {
    return Response.json({ error: "The coach is not configured yet (missing ANTHROPIC_API_KEY)." }, { status: 503 });
  }

  const blocks = testimony.draft_content?.content ?? [];
  const texts = blocks.map((b) => (b.type === "paragraph" || b.type === "heading" ? blockText(b) : ""));
  const numbered = blocks
    .map((b, i) => `[${i}] (${b.type}) ${texts[i]}`)
    .join("\n");
  const history = await loadHistory(auth.supabase, testimony.id);

  try {
    const msg = await getAnthropic().messages.parse({
      model: coachModel("suggest"),
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: zodOutputFormat(Output) },
      system: [{ type: "text", text: SUGGEST_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `<draft>\n${numbered || "(empty draft)"}\n</draft>\n\n<interview_transcript>\n${transcript(history)}\n</interview_transcript>\n\nAuthor's request: ${body.data.instruction}`,
        },
      ],
    });
    logAiUsage("suggest", msg.model, msg.usage, testimony.id);
    if (msg.stop_reason === "refusal" || !msg.parsed_output) {
      return Response.json({ error: "No suggestions this time. Please try again." }, { status: 502 });
    }

    // Keep only suggestions whose `original` is an exact excerpt of the targeted block.
    const suggestions: CoachSuggestion[] = [];
    for (const s of msg.parsed_output.suggestions) {
      const i = Math.trunc(s.blockIndex);
      if (!Number.isInteger(i) || i < 0 || i >= blocks.length) continue;
      if (s.proposed === s.original) continue;
      if (s.original !== "" && !texts[i].includes(s.original)) continue;
      suggestions.push({
        id: crypto.randomUUID(),
        blockIndex: i,
        original: s.original,
        proposed: s.proposed,
        reason: s.reason,
      });
    }
    const note = msg.parsed_output.note.trim();
    const res: SuggestResponse = { suggestions, ...(note ? { note } : {}) };
    return Response.json(res);
  } catch (err) {
    console.error("suggest error", err);
    return Response.json({ error: "No suggestions this time. Please try again." }, { status: 502 });
  }
}
