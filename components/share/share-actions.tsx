"use client";

import { useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function ShareActions({ url, handle }: { url: string; handle: string }) {
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      // fallback for insecure contexts / older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {}
      document.body.removeChild(ta);
      setCopied(ok ? "ok" : "fail");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "My testimony", text: "My testimony:", url });
    } catch {
      // user cancelled
    }
  }

  const btn = "rounded border px-3 py-1.5 text-sm hover:bg-gray-50";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className={btn}>
        Copy link
      </button>
      {canShare && (
        <button type="button" onClick={share} className={btn}>
          Share
        </button>
      )}
      <a href={`/api/vcard/${handle}`} download={`${handle}.vcf`} className={btn}>
        Download .vcf
      </a>
      <span role="status" className="text-sm">
        {copied === "ok" && "Link copied."}
        {copied === "fail" && "Copy failed; select the link above."}
      </span>
    </div>
  );
}
