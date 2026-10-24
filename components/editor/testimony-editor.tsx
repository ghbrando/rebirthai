"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import { createClient } from "@/lib/supabase/client";
import type { TestimonyContent } from "@/lib/types";
import { ImageNode, VideoNode } from "./media-nodes";
import { MediaUploader } from "./media-uploader";
import { SuggestionsPanel } from "./suggestions-panel";

type SaveState = "saved" | "saving" | "unsaved" | "error" | "blocked";

const LABEL: Record<SaveState, string> = {
  saved: "Saved",
  saving: "Saving...",
  unsaved: "Unsaved changes",
  error: "Could not save. Retrying on next edit.",
  blocked: "Not saved: add alt text to every image/video",
};

function hasMissingAlt(node: JSONContent): boolean {
  if ((node.type === "image" || node.type === "video") && !String(node.attrs?.alt ?? "").trim()) return true;
  return (node.content ?? []).some(hasMissingAlt);
}

export function TestimonyEditor({
  testimonyId,
  initialContent,
}: {
  testimonyId: string;
  initialContent: TestimonyContent;
}) {
  const [state, setState] = useState<SaveState>("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (json: JSONContent) => {
      if (hasMissingAlt(json)) {
        setState("blocked");
        return;
      }
      setState("saving");
      const supabase = createClient();
      const { error } = await supabase
        .from("testimonies")
        .update({ draft_content: json, updated_at: new Date().toISOString() })
        .eq("id", testimonyId);
      setState(error ? "error" : "saved");
    },
    [testimonyId],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        code: false,
        strike: false,
        link: false,
        underline: false,
      }),
      ImageNode,
      VideoNode,
    ],
    content: initialContent as unknown as JSONContent,
    editorProps: { attributes: { class: "prose min-h-64 max-w-none rounded border p-3 focus:outline-none" } },
    onUpdate: ({ editor }) => {
      setState("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => save(editor.getJSON()), 1500);
    },
  });

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const btn = (label: string, active: boolean, run: () => void) => (
    <button
      type="button"
      key={label}
      aria-pressed={active}
      className={`rounded border px-2 py-1 text-sm ${active ? "bg-gray-200" : ""}`}
      onClick={run}
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {editor && (
            <>
              {btn("H2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
              {btn("H3", editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
              {btn("Bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run())}
              {btn("Italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run())}
            </>
          )}
          <span className="ml-auto text-sm text-gray-600" role="status" aria-live="polite">
            {LABEL[state]}
          </span>
        </div>
        <EditorContent editor={editor} />
        <MediaUploader
          testimonyId={testimonyId}
          onInsert={(m) =>
            editor
              ?.chain()
              .focus()
              .insertContent({ type: m.kind, attrs: { mediaId: m.mediaId, alt: m.alt, caption: m.caption } })
              .run()
          }
        />
        <Link href="/preview" className="inline-block text-sm underline">
          Preview
        </Link>
      </section>
      <SuggestionsPanel editor={editor} testimonyId={testimonyId} />
    </div>
  );
}
