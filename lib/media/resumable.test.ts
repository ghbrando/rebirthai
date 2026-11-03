import { describe, expect, it, vi } from "vitest";
import type { PreviousUpload, UploadOptions } from "tus-js-client";
import type { UploadUrlResponse } from "@/lib/types";
import {
  buildTusMetadata,
  chooseUploadMethod,
  isRetryableStatus,
  mediaIdFromObjectName,
  percent,
  pickResumeCandidate,
  RESUMABLE_THRESHOLD_BYTES,
  runResumableUpload,
  TUS_CHUNK_SIZE,
  tusEndpoint,
  tusFingerprint,
  UploadCancelledError,
  type ResumableDeps,
  type TusUploadLike,
} from "./resumable";

const MB = 1024 * 1024;
const USER = "11111111-1111-4111-8111-111111111111";
const TESTIMONY = "22222222-2222-4222-8222-222222222222";
const OLD_MEDIA = "33333333-3333-4333-8333-333333333333";
const NEW_MEDIA = "44444444-4444-4444-8444-444444444444";

function prev(mediaId: string, created: string, testimony = TESTIMONY): PreviousUpload {
  return {
    size: 50 * MB,
    metadata: { objectName: `${USER}/${testimony}/${mediaId}.mp4` },
    creationTime: created,
    urlStorageKey: `key-${mediaId}`,
    uploadUrl: `https://x.supabase.co/storage/v1/upload/resumable/${mediaId}`,
    parallelUploadUrls: null,
  };
}

describe("chooseUploadMethod", () => {
  it("uses TUS only for videos above the threshold", () => {
    expect(chooseUploadMethod("video", 50 * MB)).toBe("resumable");
    expect(chooseUploadMethod("video", RESUMABLE_THRESHOLD_BYTES + 1)).toBe("resumable");
    expect(chooseUploadMethod("video", RESUMABLE_THRESHOLD_BYTES)).toBe("signed");
    expect(chooseUploadMethod("video", 1 * MB)).toBe("signed");
    expect(chooseUploadMethod("image", 9 * MB)).toBe("signed");
  });
  it("matches Supabase's required 6 MB chunk size", () => {
    expect(TUS_CHUNK_SIZE).toBe(6 * MB);
  });
});

describe("TUS request building", () => {
  it("builds the Supabase resumable endpoint", () => {
    expect(tusEndpoint("https://abc.supabase.co/")).toBe("https://abc.supabase.co/storage/v1/upload/resumable");
    expect(tusEndpoint("http://127.0.0.1:54321")).toBe("http://127.0.0.1:54321/storage/v1/upload/resumable");
  });
  it("builds bucket/object/contentType/cacheControl metadata", () => {
    const up = { bucket: "media-private", path: `${USER}/${TESTIMONY}/${NEW_MEDIA}.mov` } as const;
    expect(buildTusMetadata(up, "video/quicktime")).toEqual({
      bucketName: "media-private",
      objectName: `${USER}/${TESTIMONY}/${NEW_MEDIA}.mov`,
      contentType: "video/quicktime",
      cacheControl: "3600",
    });
  });
  it("fingerprints the file per testimony", () => {
    const f = { name: "a.mp4", type: "video/mp4", size: 10, lastModified: 5 };
    expect(tusFingerprint(TESTIMONY, f)).not.toBe(tusFingerprint(OLD_MEDIA, f));
    expect(tusFingerprint(TESTIMONY, f)).toBe(tusFingerprint(TESTIMONY, { ...f }));
  });
  it("classifies retryable statuses and computes percent", () => {
    for (const s of [0, 500, 503, 409, 423, 429]) expect(isRetryableStatus(s)).toBe(true);
    for (const s of [400, 401, 403, 404, 413]) expect(isRetryableStatus(s)).toBe(false);
    expect(percent(3, 4)).toBe(75);
    expect(percent(0, 0)).toBe(0);
  });
});

describe("resume candidate", () => {
  it("reads the media id from the object path, only for this testimony", () => {
    expect(mediaIdFromObjectName(`${USER}/${TESTIMONY}/${OLD_MEDIA}.mp4`, TESTIMONY)).toBe(OLD_MEDIA);
    expect(mediaIdFromObjectName(`${USER}/${NEW_MEDIA}/${OLD_MEDIA}.mp4`, TESTIMONY)).toBeNull();
    expect(mediaIdFromObjectName(`${USER}/${TESTIMONY}/not-a-uuid.mp4`, TESTIMONY)).toBeNull();
    expect(mediaIdFromObjectName(undefined, TESTIMONY)).toBeNull();
  });
  it("picks the newest usable earlier upload", () => {
    const older = prev(OLD_MEDIA, "2026-11-01T10:00:00Z");
    const newer = prev(NEW_MEDIA, "2026-11-02T10:00:00Z");
    const other = prev(OLD_MEDIA, "2026-11-03T10:00:00Z", NEW_MEDIA);
    expect(pickResumeCandidate([older, newer, other], TESTIMONY)?.mediaId).toBe(NEW_MEDIA);
    expect(pickResumeCandidate([{ ...older, uploadUrl: null }], TESTIMONY)).toBeNull();
    expect(pickResumeCandidate([], TESTIMONY)).toBeNull();
  });
});

// ---- orchestrator with a fake tus Upload ----

type Script = (u: FakeUpload) => void;

class FakeUpload implements TusUploadLike {
  static previous: PreviousUpload[] = [];
  static instances: FakeUpload[] = [];
  static script: Script[] = [];
  resumedFrom: PreviousUpload | null = null;
  starts = 0;
  aborted: boolean | undefined;
  constructor(
    public file: File,
    public options: UploadOptions,
  ) {
    FakeUpload.instances.push(this);
  }
  async findPreviousUploads() {
    return FakeUpload.previous;
  }
  resumeFromPreviousUpload(p: PreviousUpload) {
    this.resumedFrom = p;
  }
  start() {
    const step = FakeUpload.script[this.starts++];
    if (step) queueMicrotask(() => step(this));
  }
  async abort(shouldTerminate?: boolean) {
    this.aborted = !!shouldTerminate;
  }
}

function reset(previous: PreviousUpload[], script: Script[]) {
  FakeUpload.previous = previous;
  FakeUpload.instances = [];
  FakeUpload.script = script;
}

function deps(overrides: Partial<ResumableDeps> = {}) {
  const reserve = vi.fn(async (resumeMediaId?: string): Promise<UploadUrlResponse | null> => ({
    mediaId: resumeMediaId ?? NEW_MEDIA,
    bucket: "media-private",
    path: `${USER}/${TESTIMONY}/${resumeMediaId ?? NEW_MEDIA}.mp4`,
    token: null,
  }));
  const d: ResumableDeps = {
    Upload: FakeUpload,
    endpoint: "https://x.supabase.co/storage/v1/upload/resumable",
    apiKey: "anon",
    getAccessToken: async () => "user-jwt",
    reserve,
    forget: vi.fn(async () => undefined),
    isOnline: () => true,
    waitForOnline: async () => undefined,
    ...overrides,
  };
  return { d, reserve };
}

const video = new File([new Uint8Array(8)], "clip.mp4", { type: "video/mp4", lastModified: 1 });
const uploadOf = () => FakeUpload.instances[FakeUpload.instances.length - 1];

describe("runResumableUpload", () => {
  it("starts a new upload with the user's token, 6 MB chunks and Supabase metadata", async () => {
    reset([], [(u) => (u.options.onProgress?.(4, 8), u.options.onSuccess?.({} as never))]);
    const { d, reserve } = deps();
    const progress: number[] = [];
    const out = await runResumableUpload(video, { testimonyId: TESTIMONY, onProgress: (p) => progress.push(p) }, d);
    expect(out.mediaId).toBe(NEW_MEDIA);
    expect(reserve).toHaveBeenCalledWith();
    const u = uploadOf();
    expect(u.resumedFrom).toBeNull();
    expect(u.options.chunkSize).toBe(TUS_CHUNK_SIZE);
    expect(u.options.metadata?.objectName).toBe(`${USER}/${TESTIMONY}/${NEW_MEDIA}.mp4`);
    expect(u.options.removeFingerprintOnSuccess).toBe(true);
    const headers: Record<string, string> = {};
    await u.options.onBeforeRequest?.({ setHeader: (k: string, v: string) => (headers[k] = v) } as never);
    expect(headers.authorization).toBe("Bearer user-jwt");
    expect(progress).toEqual([50, 100]);
  });

  it("resumes an interrupted upload of the same file into the same media row", async () => {
    const earlier = prev(OLD_MEDIA, "2026-11-01T10:00:00Z");
    reset([earlier], [(u) => u.options.onSuccess?.({} as never)]);
    const { d, reserve } = deps();
    const out = await runResumableUpload(video, { testimonyId: TESTIMONY, onProgress: () => {} }, d);
    expect(reserve).toHaveBeenCalledWith(OLD_MEDIA);
    expect(reserve).toHaveBeenCalledTimes(1);
    expect(uploadOf().resumedFrom).toBe(earlier);
    expect(uploadOf().options.metadata?.objectName).toBe(earlier.metadata.objectName);
    expect(out.mediaId).toBe(OLD_MEDIA);
  });

  it("starts fresh and forgets stale entries when the server refuses the resume", async () => {
    const earlier = prev(OLD_MEDIA, "2026-11-01T10:00:00Z");
    reset([earlier], [(u) => u.options.onSuccess?.({} as never)]);
    const reserve = vi.fn(async (id?: string) =>
      id
        ? null
        : ({ mediaId: NEW_MEDIA, bucket: "media-private", path: `${USER}/${TESTIMONY}/${NEW_MEDIA}.mp4`, token: null } as const),
    );
    const { d } = deps({ reserve });
    const out = await runResumableUpload(video, { testimonyId: TESTIMONY, onProgress: () => {} }, d);
    expect(reserve.mock.calls).toEqual([[OLD_MEDIA], []]);
    expect(d.forget).toHaveBeenCalledWith(earlier.urlStorageKey);
    expect(uploadOf().resumedFrom).toBeNull();
    expect(out.mediaId).toBe(NEW_MEDIA);
  });

  it("pauses while offline and continues the same upload when back online", async () => {
    let online = true;
    let backOnline!: () => void;
    reset(
      [],
      [
        (u) => {
          u.options.onProgress?.(2, 8);
          online = false;
          u.options.onError?.(new Error("network"));
        },
        (u) => u.options.onSuccess?.({} as never),
      ],
    );
    const { d } = deps({
      isOnline: () => online,
      waitForOnline: () => new Promise<void>((r) => (backOnline = r)),
    });
    const statuses: string[] = [];
    const done = runResumableUpload(
      video,
      { testimonyId: TESTIMONY, onProgress: () => {}, onStatus: (s) => statuses.push(s) },
      d,
    );
    await vi.waitFor(() => expect(statuses).toContain("reconnecting"));
    online = true;
    backOnline();
    await expect(done).resolves.toEqual({ mediaId: NEW_MEDIA });
    expect(uploadOf().starts).toBe(2); // same Upload instance restarted: tus continues from the server offset
    expect(statuses.at(-1)).toBe("uploading");
  });

  it("does not retry while offline and does retry server errors while online", async () => {
    reset([], [(u) => u.options.onSuccess?.({} as never)]);
    let online = true;
    const { d } = deps({ isOnline: () => online });
    await runResumableUpload(video, { testimonyId: TESTIMONY, onProgress: () => {} }, d);
    const retry = uploadOf().options.onShouldRetry!;
    const err = (status: number) => ({ originalResponse: { getStatus: () => status } }) as never;
    expect(retry(err(503), 0, {})).toBe(true);
    expect(retry(err(403), 0, {})).toBe(false);
    online = false;
    expect(retry(err(503), 0, {})).toBe(false);
  });

  it("shows a plain message on a non-retryable error", async () => {
    reset([], [(u) => u.options.onError?.(Object.assign(new Error("x"), { originalResponse: { getStatus: () => 403 } }))]);
    const { d } = deps();
    await expect(runResumableUpload(video, { testimonyId: TESTIMONY, onProgress: () => {} }, d)).rejects.toThrow(
      /sign in again/,
    );
  });

  it("cancels and terminates the upload on abort", async () => {
    reset([], []);
    const { d } = deps();
    const ctl = new AbortController();
    const done = runResumableUpload(video, { testimonyId: TESTIMONY, onProgress: () => {}, signal: ctl.signal }, d);
    await vi.waitFor(() => expect(uploadOf()?.starts).toBe(1));
    ctl.abort();
    await expect(done).rejects.toBeInstanceOf(UploadCancelledError);
    expect(uploadOf().aborted).toBe(true);
  });
});
