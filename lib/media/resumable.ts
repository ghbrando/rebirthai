// Resumable (TUS) uploads for large videos (RC-09, RISK-06, US-07, #13).
// The browser sends the file straight to Supabase Storage's TUS endpoint with the signed-in user's own
// access token, so the storage RLS policies apply. Never the service role here (RC-07).
// Pure helpers plus an orchestrator with injected dependencies, so the resume logic is unit-testable.

import type { DetailedError, PreviousUpload, UploadOptions } from "tus-js-client";
import type { UploadUrlResponse } from "@/lib/types";
import type { MediaKind } from "./validate";

/** Supabase requires exactly 6 MB chunks for resumable uploads. */
export const TUS_CHUNK_SIZE = 6 * 1024 * 1024;
/** Videos larger than this use TUS; images and small videos keep the one-shot signed URL. */
export const RESUMABLE_THRESHOLD_BYTES = 6 * 1024 * 1024;
/** Automatic retries while the browser still reports being online (ms). */
export const TUS_RETRY_DELAYS = [0, 1000, 3000, 5000, 10000, 20000];

export type UploadMethod = "resumable" | "signed";
export type UploadStatus = "uploading" | "reconnecting";

export function chooseUploadMethod(kind: MediaKind, bytes: number): UploadMethod {
  return kind === "video" && bytes > RESUMABLE_THRESHOLD_BYTES ? "resumable" : "signed";
}

export function tusEndpoint(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/upload/resumable`;
}

/** Metadata Supabase reads from the TUS Upload-Metadata header. */
export function buildTusMetadata(up: Pick<UploadUrlResponse, "bucket" | "path">, mime: string) {
  return {
    bucketName: up.bucket,
    objectName: up.path,
    contentType: mime,
    cacheControl: "3600",
  };
}

/** Stable 53-bit string hash (cyrb53). Not cryptographic; only keeps raw file names out of storage. */
export function stableHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Identifies "the same file for the same testimony" across retries and page reloads. tus keeps it in
 *  localStorage, so it holds a hash of name + size + lastModified, never the raw file name. */
export function tusFingerprint(
  testimonyId: string,
  file: Pick<File, "name" | "size" | "lastModified">,
): string {
  return `rebirthai-tus-${testimonyId}-${stableHash([file.name, file.size, file.lastModified].join("|"))}`;
}

/** tus-js-client keeps resumable upload URLs in localStorage under "tus::". Cleared on sign-out and
 *  account deletion so the next person on a shared device sees no trace of the uploads. */
export function clearTusStorage(given?: Pick<Storage, "length" | "key" | "removeItem">) {
  try {
    const storage = given ?? (typeof window === "undefined" ? undefined : window.localStorage);
    if (!storage) return;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k?.startsWith("tus::")) keys.push(k);
    }
    for (const k of keys) storage.removeItem(k);
  } catch {
    // Storage blocked (private mode): nothing stored, nothing to clear.
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** objectName is `{user_id}/{testimony_id}/{media_id}.{ext}` (set by /api/upload-url). */
export function mediaIdFromObjectName(objectName: string | undefined, testimonyId: string): string | null {
  if (!objectName) return null;
  const parts = objectName.split("/");
  if (parts.length !== 3 || parts[1] !== testimonyId) return null;
  const id = parts[2].replace(/\.[a-z0-9]+$/i, "");
  return UUID.test(id) ? id : null;
}

/** Newest earlier upload of this file for this testimony that the server can still continue. */
export function pickResumeCandidate(
  previous: PreviousUpload[],
  testimonyId: string,
): { mediaId: string; upload: PreviousUpload } | null {
  const usable = previous
    .map((upload) => ({ upload, mediaId: mediaIdFromObjectName(upload.metadata?.objectName, testimonyId) }))
    .filter((c): c is { upload: PreviousUpload; mediaId: string } => !!c.mediaId && !!c.upload.uploadUrl)
    .sort((a, b) => Date.parse(b.upload.creationTime) - Date.parse(a.upload.creationTime));
  return usable[0] ?? null;
}

/** Retry server errors, timeouts/network failures (status 0), lock conflicts and rate limits. */
export function isRetryableStatus(status: number): boolean {
  return status === 0 || status >= 500 || status === 409 || status === 423 || status === 429;
}

export function percent(sent: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((sent / total) * 100)));
}

export function friendlyTusError(status: number): string {
  if (status === 401 || status === 403) return "Your session ended. Please sign in again and retry the upload.";
  if (status === 413) return "That video is too large. The limit is 100 MB for videos.";
  if (status === 0 || status >= 500) {
    return "The connection dropped during the upload. Try again and it will continue from where it stopped.";
  }
  return "Upload failed. Please try again.";
}

export class UploadCancelledError extends Error {
  constructor() {
    super("Upload cancelled.");
    this.name = "UploadCancelledError";
  }
}

// ---- orchestrator ----

export interface TusUploadLike {
  start(): void;
  abort(shouldTerminate?: boolean): Promise<void>;
  findPreviousUploads(): Promise<PreviousUpload[]>;
  resumeFromPreviousUpload(previousUpload: PreviousUpload): void;
}
export type TusUploadCtor = new (file: File, options: UploadOptions) => TusUploadLike;

export interface ResumableDeps {
  Upload: TusUploadCtor;
  endpoint: string;
  /** Public anon key, sent as `apikey` for the API gateway. */
  apiKey: string;
  /** Current session access token (refreshed if needed); null when signed out. */
  getAccessToken(): Promise<string | null>;
  /** Asks /api/upload-url for a media row and path. Returns null if a resume was refused. */
  reserve(resumeMediaId?: string): Promise<UploadUrlResponse | null>;
  /** Drops a stale entry from tus's resume storage. */
  forget(urlStorageKey: string): Promise<void>;
  isOnline(): boolean;
  /** Resolves when the browser is back online (or immediately if the signal aborts). */
  waitForOnline(signal?: AbortSignal): Promise<void>;
}

export interface ResumableOptions {
  testimonyId: string;
  onProgress: (pct: number) => void;
  onStatus?: (status: UploadStatus) => void;
  signal?: AbortSignal;
}

function statusOf(err: Error | DetailedError): number {
  const res = (err as DetailedError).originalResponse;
  return res ? res.getStatus() : 0;
}

export async function runResumableUpload(
  file: File,
  opts: ResumableOptions,
  deps: ResumableDeps,
): Promise<{ mediaId: string }> {
  const { testimonyId, onProgress, onStatus, signal } = opts;
  if (signal?.aborted) throw new UploadCancelledError();
  const fingerprint = tusFingerprint(testimonyId, file);

  // 1. Is there an interrupted upload of this exact file we can continue?
  const probe = new deps.Upload(file, { endpoint: deps.endpoint, fingerprint: async () => fingerprint });
  const previous = await probe.findPreviousUploads().catch(() => [] as PreviousUpload[]);
  let candidate = pickResumeCandidate(previous, testimonyId);

  // 2. Reserve the media row: the earlier one if the server still recognises it, otherwise a new one.
  let reserved = candidate ? await deps.reserve(candidate.mediaId) : null;
  if (!reserved) {
    for (const p of previous) await deps.forget(p.urlStorageKey).catch(() => undefined);
    candidate = null;
    reserved = await deps.reserve();
    if (!reserved) throw new Error("Could not start the upload.");
  }
  const up = reserved;
  if (signal?.aborted) throw new UploadCancelledError();

  // 3. Upload in 6 MB chunks; tus resumes from the server's offset after errors and reloads.
  return new Promise<{ mediaId: string }>((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      if (err) reject(err);
      else resolve({ mediaId: up.mediaId });
    };

    const upload = new deps.Upload(file, {
      endpoint: deps.endpoint,
      chunkSize: TUS_CHUNK_SIZE,
      retryDelays: TUS_RETRY_DELAYS,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      fingerprint: async () => fingerprint,
      metadata: buildTusMetadata(up, file.type),
      headers: { apikey: deps.apiKey, "x-upsert": "false" },
      onBeforeRequest: async (req) => {
        // Fresh token on every request: a 100 MB upload on a slow phone can outlast one access token.
        const token = await deps.getAccessToken();
        if (token) req.setHeader("authorization", `Bearer ${token}`);
      },
      onShouldRetry: (err) => {
        if (!deps.isOnline() || !isRetryableStatus(statusOf(err))) return false;
        onStatus?.("reconnecting");
        return true;
      },
      onProgress: (sent, total) => {
        onStatus?.("uploading");
        onProgress(percent(sent, total));
      },
      onSuccess: () => {
        onProgress(100);
        finish();
      },
      onError: (err) => {
        if (settled || signal?.aborted) return;
        if (!deps.isOnline()) {
          // Offline: wait as long as it takes, then continue from the last confirmed chunk.
          onStatus?.("reconnecting");
          void deps.waitForOnline(signal).then(() => {
            if (settled || signal?.aborted) return;
            onStatus?.("uploading");
            upload.start();
          });
          return;
        }
        finish(new Error(friendlyTusError(statusOf(err))));
      },
    });

    function onAbort() {
      void upload.abort(true).catch(() => undefined);
      finish(new UploadCancelledError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });

    if (candidate) upload.resumeFromPreviousUpload(candidate.upload);
    onStatus?.("uploading");
    upload.start();
  });
}

/** Browser helpers for ResumableDeps. */
export const browserNetwork = {
  isOnline: () => (typeof navigator === "undefined" ? true : navigator.onLine !== false),
  waitForOnline: (signal?: AbortSignal) =>
    new Promise<void>((resolve) => {
      if (typeof window === "undefined" || navigator.onLine !== false || signal?.aborted) return resolve();
      const done = () => {
        window.removeEventListener("online", done);
        signal?.removeEventListener("abort", done);
        resolve();
      };
      window.addEventListener("online", done);
      signal?.addEventListener("abort", done);
    }),
};
