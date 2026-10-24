"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CoachMessage, CoachSection } from "@/lib/types";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const ARC: { key: CoachSection; label: string }[] = [
  { key: "before", label: "Before" },
  { key: "turning_point", label: "Turning point" },
  { key: "after", label: "After" },
];

export function CoachChat() {
  const [testimonyId, setTestimonyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [covered, setCovered] = useState<CoachSection[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [drafted, setDrafted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const send = useCallback(async (text: string) => {
    setError(null);
    setStreaming(true);
    const assistantId = `tmp-${Date.now()}`;
    if (text) {
      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: text }]);
    }
    setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(text ? { message: text } : {}),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Something went wrong. Please try again.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, i).replace(/^data: /, "");
          buf = buf.slice(i + 2);
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.type === "text") {
            setMessages((m) =>
              m.map((x) => (x.id === assistantId ? { ...x, content: x.content + ev.text } : x)),
            );
          } else if (ev.type === "done") {
            setCovered(ev.covered ?? []);
          } else if (ev.type === "error") {
            throw new Error(ev.message);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages((m) => m.filter((x) => !(x.id === assistantId && x.content === "")));
    } finally {
      setStreaming(false);
    }
  }, []);

  // Load history on mount (US-04); start the welcome if the session is new.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/coach");
        if (!res.ok) throw new Error("Could not load your conversation.");
        const j = await res.json();
        setTestimonyId(j.testimonyId);
        const hist: Msg[] = (j.messages as CoachMessage[]).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));
        setMessages(hist);
        setCovered(j.covered ?? []);
        setLoading(false);
        if (hist.length === 0) await send("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load.");
        setLoading(false);
      }
    })();
  }, [send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    await send(text);
  }

  async function createDraft() {
    if (!testimonyId) return;
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonyId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Couldn't create a draft.");
      setDrafted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create a draft.");
    } finally {
      setDrafting(false);
    }
  }

  const ready = ARC.every((a) => covered.includes(a.key));
  const hasUserMsg = messages.some((m) => m.role === "user");

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.25rem)] w-full max-w-2xl flex-col">
      <div className="border-b px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5 text-xs">
            {ARC.map((a) => (
              <span
                key={a.key}
                className={`rounded-full px-2 py-0.5 ${
                  covered.includes(a.key) ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                }`}
              >
                {covered.includes(a.key) ? "✓ " : ""}
                {a.label}
              </span>
            ))}
          </div>
          {drafted ? (
            <Link href="/editor" className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white">
              Open editor
            </Link>
          ) : (
            <button
              onClick={createDraft}
              disabled={!hasUserMsg || drafting || streaming}
              className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${
                ready ? "bg-black text-white" : "border border-gray-300 text-gray-700"
              }`}
            >
              {drafting ? "Writing your draft…" : "Create my draft"}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          This AI coach helps you tell your story. It is not a counselor or pastor and can&apos;t give
          counseling. If you are in crisis, call or text 988.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {loading && <p className="text-sm text-gray-500">Loading your conversation&hellip;</p>}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed ${
                m.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content || <span className="text-gray-400">&hellip;</span>}
            </div>
          </div>
        ))}
        {drafted && (
          <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            Your draft is ready. You can edit every word in the editor.
          </p>
        )}
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          maxLength={4000}
          placeholder="Type your answer (or say 'skip')"
          className="min-h-11 flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-[15px]"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="h-11 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
