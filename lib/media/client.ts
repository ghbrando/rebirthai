import type { UploadUrlRequest, UploadUrlResponse } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  browserNetwork,
  chooseUploadMethod,
  runResumableUpload,
  tusEndpoint,
  UploadCancelledError,
  type UploadStatus,
} from "./resumable";
import { stripImageMetadata } from "./strip-exif";
import { validateFile, validateMedia, type MediaKind } from "./validate";

export { UploadCancelledError, type UploadStatus };

export interface UploadedMedia {
  mediaId: string;
  kind: MediaKind;
}

export interface UploadCallbacks {
  onProgress: (pct: number) => void;
  /** "reconnecting" while a resumable upload waits for the network. */
  onStatus?: (status: UploadStatus) => void;
  /** Abort to cancel; the promise then rejects with UploadCancelledError. */
  signal?: AbortSignal;
}

async function reserveUpload(body: UploadUrlRequest): Promise<Response> {
  return fetch("/api/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function errorFrom(res: Response, fallback: string): Promise<Error> {
  const j = await res.json().catch(() => ({}));
  return new Error(j.error ?? fallback);
}

/** Validate -> strip EXIF (images) -> reserve a media row -> upload straight to Supabase Storage.
 *  Large videos use resumable TUS uploads (RC-09, #13); images and small videos use a signed URL.
 *  The file never passes through a Vercel function. */
export async function uploadMedia(
  testimonyId: string,
  original: File,
  { onProgress, onStatus, signal }: UploadCallbacks,
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

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const body: UploadUrlRequest = { testimonyId, kind, mime: file.type, bytes: file.size };

  if (chooseUploadMethod(kind, file.size) === "resumable") {
    const supabase = createClient();
    const tus = await import("tus-js-client");
    const { mediaId } = await runResumableUpload(
      file,
      { testimonyId, onProgress, onStatus, signal },
      {
        Upload: tus.Upload,
        endpoint: tusEndpoint(base),
        apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        // The user's own session token: storage RLS applies (never the service role, RC-07).
        getAccessToken: async () => (await supabase.auth.getSession()).data.session?.access_token ?? null,
        reserve: async (resumeMediaId) => {
          const res = await reserveUpload({ ...body, method: "resumable", resumeMediaId });
          if (res.ok) return (await res.json()) as UploadUrlResponse;
          if (resumeMediaId && res.status === 404) return null;
          throw await errorFrom(res, "Could not start the upload.");
        },
        forget: (key) => tus.defaultOptions.urlStorage.removeUpload(key),
        ...browserNetwork,
      },
    );
    return { mediaId, kind };
  }

  const res = await reserveUpload(body);
  if (!res.ok) throw await errorFrom(res, "Could not start the upload.");
  const up = (await res.json()) as UploadUrlResponse;
  if (!up.token) throw new Error("Could not start the upload.");

  const url = `${base}/storage/v1/object/upload/sign/${up.bucket}/${up.path}?token=${encodeURIComponent(up.token)}`;
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new UploadCancelledError());
    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Upload failed. Please try again."));
    };
    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Network error during upload. Please try again."));
    };
    xhr.onabort = () => reject(new UploadCancelledError());
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
