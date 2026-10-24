"use client";

import { useRef, useState } from "react";
import { saveMediaMeta, uploadMedia } from "@/lib/media/client";

/** Pick -> validate/strip/upload with progress -> REQUIRE alt text/description before inserting (RC-11). */
export function MediaUploader({
  testimonyId,
  onInsert,
}: {
  testimonyId: string;
  onInsert: (m: { kind: "image" | "video"; mediaId: string; alt: string; caption: string | null }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ kind: "image" | "video"; mediaId: string } | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const up = await uploadMedia(testimonyId, file, setProgress);
      setPending(up);
      setAlt("");
      setCaption("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  async function confirm() {
    if (!pending || !alt.trim()) return;
    setSaving(true);
    try {
      await saveMediaMeta(pending.mediaId, alt.trim(), caption.trim() || null);
      onInsert({ ...pending, alt: alt.trim(), caption: caption.trim() || null });
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="text-sm">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        className="rounded border px-3 py-1"
        disabled={progress !== null || !!pending}
        onClick={() => input.current?.click()}
      >
        Add photo or video
      </button>
      {progress !== null && (
        <div className="mt-2" role="status">
          <progress value={progress} max={100} className="w-full" />
          <span className="text-xs">{progress}% uploaded</span>
        </div>
      )}
      {error && (
        <p className="mt-2 text-red-600" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <div className="mt-2 rounded border p-3">
          <p className="font-medium">
            {pending.kind === "image" ? "Describe this image (alt text, required)" : "Describe this video (required)"}
          </p>
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="What is shown?"
            autoFocus
          />
          <input
            className="mt-2 w-full rounded border px-2 py-1"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
              disabled={!alt.trim() || saving}
              onClick={confirm}
            >
              Insert into testimony
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
