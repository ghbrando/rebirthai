import type { UploadUrlRequest, UploadUrlResponse } from "@/lib/types";
import { stripImageMetadata } from "./strip-exif";
import { validateFile, validateMedia, type MediaKind } from "./validate";

export interface UploadedMedia {
  mediaId: string;
  kind: MediaKind;
}

/** Validate -> strip EXIF (images) -> request signed URL -> upload with progress.
 *  NOTE: single-shot XHR PUT; true TUS resumability (RC-09) is deferred (see report). */
export async function uploadMedia(
  testimonyId: string,
  original: File,
  onProgress: (pct: number) => void,
): Promise<UploadedMedia> {
  const checked = validateFile(original);
  if ("error" in checked) throw new Error(checked.error);
  const { kind } = checked;

  let file = original;
  if (kind === "image") {
    try {
      file = await stripImageMetadata(original);
    } catch {
      throw new Error("Could not process that image to remove location data. Try a different file.");
    }
    const err = validateMedia(kind, file.type, file.size);
    if (err) throw new Error(err);
  }

  const body: UploadUrlRequest = { testimonyId, kind, mime: file.type, bytes: file.size };
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "Could not start the upload.");
  }
  const up = (await res.json()) as UploadUrlResponse;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = `${base}/storage/v1/object/upload/sign/${up.bucket}/${up.path}?token=${encodeURIComponent(up.token)}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error("Upload failed. Please try again."));
    xhr.onerror = () => reject(new Error("Network error during upload. Please try again."));
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", file);
    xhr.send(form);
  });
  onProgress(100);
  return { mediaId: up.mediaId, kind };
}

export async function saveMediaMeta(mediaId: string, altText: string, caption: string | null) {
  const res = await fetch("/api/upload-url/meta", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mediaId, altText, caption }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? "Could not save description.");
  }
}

// ---- short-lived signed read URLs while draft (RC-06) ----
const cache = new Map<string, { url: string; exp: number }>();
const inflight = new Map<string, Promise<string | null>>();

export function getSignedUrl(mediaId: string): Promise<string | null> {
  const hit = cache.get(mediaId);
  if (hit && hit.exp > Date.now()) return Promise.resolve(hit.url);
  const pending = inflight.get(mediaId);
  if (pending) return pending;
  const p = fetch("/api/upload-url/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mediaIds: [mediaId] }),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { urls: Record<string, string> } | null) => {
      const url = j?.urls?.[mediaId] ?? null;
      if (url) cache.set(mediaId, { url, exp: Date.now() + 50 * 60 * 1000 });
      return url;
    })
    .catch(() => null)
    .finally(() => inflight.delete(mediaId));
  inflight.set(mediaId, p);
  return p;
}
