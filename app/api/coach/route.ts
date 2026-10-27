import type Anthropic from "@anthropic-ai/sdk";
import { getUserOrNull } from "@/lib/auth";
import { aiConfigured, getAnthropic } from "@/lib/ai/client";
import { coachModel, logAiUsage } from "@/lib/ai/usage";
import {
  COACH_OPENING_USER_TURN,
  COACH_SYSTEM_PROMPT,
  parseSectionTag,
} from "@/lib/ai/prompts";
import {
  RATE_LIMIT_PER_HOUR,
  coveredSections,
  getOrCreateTestimony,
  lastSection,
  loadHistory,
  recentUserMessageCount,
} from "@/lib/ai/coach-data";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY = 100;

/** GET /api/coach: history for resuming a session (US-04). */
export async function GET() {
  const auth = await getUserOrNull();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const testimony = await getOrCreateTestimony(auth.supabase, auth.user.id);
  if (!testimony) return Response.json({ error: "Profile required" }, { status: 409 });
  const messages = await loadHistory(auth.supabase, testimony.id);
  return Response.json({
    testimonyId: testimony.id,
    messages,
    covered: coveredSections(messages),
    lastSection: lastSection(messages),
    aiReady: aiConfigured(),
  });
}

/**
 * POST /api/coach { message?: string }: streams the coach reply as SSE (`data: {json}`).
 * Events: {type:"text",text} ... {type:"done",section,covered,message} | {type:"error",message}.
 * With empty history and no message it produces the welcome + first question.
 */
export async function POST(req: Request) {
  const auth = await getUserOrNull();
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user } = auth;

  let body: { message?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine (welcome request)
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > MAX_MESSAGE_CHARS) {
    return Response.json({ error: "Message too long" }, { status: 413 });
  }

  const testimony = await getOrCreateTestimony(supabase, user.id);
  if (!testimony) return Response.json({ error: "Profile required" }, { status: 409 });

  if (!aiConfigured()) {
    return Response.json({ error: "The coach is not configured yet (missing ANTHROPIC_API_KEY)." }, { status: 503 });
  }

  const history = await loadHistory(supabase, testimony.id);
  if (message === "" && history.length > 0) {
    return Response.json({ error: "Message required" }, { status: 400 });
  }

  if (message) {
    const used = await recentUserMessageCount(supabase, testimony.id);
    if (used >= RATE_LIMIT_PER_HOUR) {
      return Response.json(
        { error: "You've reached the hourly message limit. Please take a break and come back soon." },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }
    const ins = await supabase
      .from("coach_messages")
      .insert({ testimony_id: testimony.id, role: "user", content: message });
    if (ins.error) return Response.json({ error: "Could not save message" }, { status: 500 });
  }

  // Build model messages. The API needs the first turn to be a user turn.
  const turns: Anthropic.MessageParam[] = history
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }));
  if (message) turns.push({ role: "user", content: message });
  if (turns.length === 0 || turns[0].role === "assistant") {
    turns.unshift({ role: "user", content: COACH_OPENING_USER_TURN });
  }

  const encoder = new TextEncoder();
  const send = (c: ReadableStreamDefaultController, obj: unknown) =>
    c.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      const model = coachModel("interview");
      let logged = false;
      let emitted = 0;
      try {
        const events = getAnthropic().beta.messages.stream(
          {
            model,
            max_tokens: 2048,
            thinking: { type: "adaptive" },
            output_config: { effort: "low" }, // chat: first tokens fast
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: [
              { type: "text", text: COACH_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
            ],
            messages: turns,
          },
          { signal: req.signal },
        );

        for await (const ev of events) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            full += ev.delta.text;
            // hold back a trailing "[[section: x]]" tag (and any partial "[" start) from the client
            const idx = full.indexOf("[[");
            const limit = idx >= 0 ? idx : full.endsWith("[") ? full.length - 1 : full.length;
            if (limit > emitted) {
              send(controller, { type: "text", text: full.slice(emitted, limit) });
              emitted = limit;
            }
          }
        }
        const final = await events.finalMessage();
        logAiUsage("interview", model, final.model, final.usage, testimony.id);
        logged = true;
        if (final.stop_reason === "refusal" && !full.trim()) {
          full = "I'm not able to respond to that, but I'm still here. Would you like to continue with your story whenever you're ready?\n[[section: other]]";
          send(controller, { type: "text", text: parseSectionTag(full).text });
        }

        const parsed = parseSectionTag(full);
        const saved = await supabase
          .from("coach_messages")
          .insert({
            testimony_id: testimony.id,
            role: "assistant",
            content: parsed.text,
            section: parsed.section,
          })
          .select("*")
          .single();
        const all = await loadHistory(supabase, testimony.id);
        send(controller, {
          type: "done",
          section: parsed.section,
          covered: coveredSections(all),
          message: saved.data ?? null,
        });
      } catch (err) {
        if (!logged) logAiUsage("interview", model, null, null, testimony.id);
        if (!req.signal.aborted) {
          console.error("coach stream error", err);
          send(controller, { type: "error", message: "The coach hit a problem. Please try again." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
