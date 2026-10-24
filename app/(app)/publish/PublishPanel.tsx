"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  status: "draft" | "published" | "unpublished";
  visibility: "public" | "unlisted";
  handle: string;
  canPublish: boolean;
};

export function PublishPanel({ status, visibility: initial, handle, canPublish }: Props) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "publish" | "unpublish" | "delete") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, visibility }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Something went wrong");
      if (action === "publish") router.push("/contact");
      else router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (
      window.confirm(
        "Delete your testimony permanently? This removes your draft, coach conversation, photos and videos, and your public page. This cannot be undone.",
      )
    )
      void act("delete");
  }

  const published = status === "published";
  return (
    <div className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="font-semibold">Who can see it?</legend>
        <label className="flex items-start gap-2">
          <input type="radio" name="vis" checked={visibility === "public"} onChange={() => setVisibility("public")} />
          <span>
            <b>Public</b> — anyone with the link; search engines may index it.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input type="radio" name="vis" checked={visibility === "unlisted"} onChange={() => setVisibility("unlisted")} />
          <span>
            <b>Unlisted</b> — anyone with the link, but hidden from search engines.
          </span>
        </label>
      </fieldset>

      {published && (
        <p className="text-sm">
          Live at{" "}
          <a className="text-blue-800 underline" href={`/@${handle}`}>
            /@{handle}
          </a>
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          disabled={busy || !canPublish}
          onClick={() => act("publish")}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {published ? "Republish" : "Publish"}
        </button>
        {published && (
          <button disabled={busy} onClick={() => act("unpublish")} className="rounded-lg border px-4 py-2">
            Unpublish
          </button>
        )}
        <button
          disabled={busy}
          onClick={confirmDelete}
          className="rounded-lg border border-red-700 px-4 py-2 text-red-800"
        >
          Delete permanently
        </button>
      </div>
      {!canPublish && <p className="text-sm text-gray-700">Add a title and some content before publishing.</p>}
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
