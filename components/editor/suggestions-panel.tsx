"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import type { CoachSuggestion, SuggestRequest, SuggestResponse } from "@/lib/types";

const CHIPS = ["Make this shorter", "What's missing?", "Make it clearer", "Fix grammar"];

/** Locate [from,to) of `original` in the doc, preferring the suggested block. Returns null if not found. */
function locate(editor: Editor, s: CoachSuggestion): { from: number; to: number; blockEnd: number } | null {
  const doc = editor.state.doc;
  const blocks: { node: typeof doc; pos: number }[] = [];
  doc.forEach((node, pos) => blocks.push({ node: node as typeof doc, pos }));
  const order = [s.blockIndex, ...blocks.map((_, i) => i).filter((i) => i !== s.blockIndex)];
  for (const i of order) {
    const b = blocks[i];
    if (!b || !b.node.isTextblock) continue;
    const blockEnd = b.pos + b.node.nodeSize;
    if (s.original === "") {
      if (i === s.blockIndex) return { from: blockEnd, to: blockEnd, blockEnd };
      continue;
    }
    const text = b.node.textContent;
    const idx = text.indexOf(s.original);
    if (idx < 0) continue;
    // text offset -> doc position (text blocks here contain only inline text nodes)
    return { from: b.pos + 1 + idx, to: b.pos + 1 + idx + s.original.length, blockEnd };
  }
  return null;
}

export function SuggestionsPanel({ editor, testimonyId }: { editor: Editor | null; testimonyId: string }) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [items, setItems] = useState<CoachSuggestion[]>([]);

  async function ask(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const body: SuggestRequest = { testimonyId, instruction: text.trim() };
      const res = await fetch("/api/coach/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Suggestions are unavailable right now. Please try again.");
      const data = (await res.json()) as SuggestResponse;
      setItems(data.suggestions ?? []);
      setNote(data.note ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function accept(s: CoachSuggestion) {
    if (!editor) return;
    const loc = locate(editor, s);
    if (!loc) {
      setError("That part of the text has changed, so this suggestion no longer applies.");
      setItems((cur) => cur.filter((x) => x.id !== s.id));
      return;
    }
    if (s.original === "") {
      editor
        .chain()
        .focus()
        .insertContentAt(loc.from, { type: "paragraph", content: [{ type: "text", text: s.proposed }] })
        .run();
    } else if (s.proposed === "") {
      editor.chain().focus().deleteRange({ from: loc.from, to: loc.to }).run();
    } else {
      editor.chain().focus().insertContentAt({ from: loc.from, to: loc.to }, s.proposed).run();
    }
    setItems((cur) => cur.filter((x) => x.id !== s.id));
  }

  const reject = (s: CoachSuggestion) => setItems((cur) => cur.filter((x) => x.id !== s.id));

  return (
    <aside className="space-y-3 text-sm" aria-label="Suggestions">
      <h2 className="text-lg font-semibold">Suggestions</h2>
      <p className="text-gray-600">Nothing changes in your testimony unless you press Accept.</p>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button key={c} type="button" className="rounded-full border px-3 py-1" disabled={loading} onClick={() => ask(c)}>
            {c}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(instruction);
        }}
      >
        <input
          className="min-w-0 flex-1 rounded border px-2 py-1"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Ask for a change..."
          aria-label="Instruction for suggestions"
        />
        <button type="submit" className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>
      {error && (
        <p className="text-red-600" role="alert">
          {error}
        </p>
      )}
      {note && <p className="rounded bg-gray-100 p-2 whitespace-pre-wrap">{note}</p>}
      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id} className="rounded border p-3">
            {s.original ? (
              <p className="text-gray-600 line-through">{s.original}</p>
            ) : (
              <p className="text-xs text-gray-500">New text after block {s.blockIndex + 1}</p>
            )}
            <p className="mt-1 text-green-800">{s.proposed || "(remove this text)"}</p>
            <p className="mt-1 text-xs text-gray-500">{s.reason}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded bg-black px-3 py-1 text-white" onClick={() => accept(s)}>
                Accept
              </button>
              <button type="button" className="rounded border px-3 py-1" onClick={() => reject(s)}>
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
