"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearTusStorage } from "@/lib/media/resumable";
import { CONFIRM_WORD } from "@/lib/account/delete";

/** Settings: permanently delete the account (#26). Requires typing DELETE. */
export function DeleteAccount({ handle }: { handle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = typed.trim() === CONFIRM_WORD && !busy;

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRM_WORD }),
      });
      if (res.ok) {
        clearTusStorage();
        router.replace("/account-deleted");
        router.refresh(); // drop cached signed-in screens
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "We couldn't delete your account. Please try again.");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <section aria-labelledby="delete-account" className="space-y-3 rounded-lg border border-red-300 p-4">
      <h2 id="delete-account" className="text-lg font-medium text-red-800">
        Delete my account
      </h2>
      {!open ? (
        <>
          <p className="text-sm text-gray-700">
            Permanently remove your account and everything in it. This cannot be undone.
          </p>
          <Button type="button" variant="destructive" size="lg" className="h-11" onClick={() => setOpen(true)}>
            Delete my account…
          </Button>
        </>
      ) : (
        <form onSubmit={onDelete} className="space-y-3">
          <p className="text-sm text-gray-900">This permanently deletes:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-900">
            <li>your profile and contact details</li>
            <li>your testimony, published and unpublished</li>
            <li>your conversations with the coach</li>
            <li>all your photos and videos</li>
          </ul>
          <p className="text-sm text-gray-900">
            Your link <strong>/@{handle}</strong> will stop showing your story. Anyone who saved your
            contact card will see that it is no longer available. Nobody else can ever take your
            handle. This cannot be undone.
          </p>
          <label className="block text-sm text-gray-900">
            Type <strong>{CONFIRM_WORD}</strong> to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="mt-1 block w-full max-w-xs rounded border border-gray-500 p-2 text-gray-900"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="destructive" size="lg" className="h-11" disabled={!ready}>
              {busy ? "Deleting…" : "Permanently delete my account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
