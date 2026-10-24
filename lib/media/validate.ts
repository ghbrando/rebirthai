import { MEDIA_LIMITS } from "@/lib/types";

export type MediaKind = "image" | "video";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

export function extForMime(mime: string): string | null {
  return EXT[mime] ?? null;
}

export function kindForMime(mime: string): MediaKind | null {
  if ((MEDIA_LIMITS.image.mimes as readonly string[]).includes(mime)) return "image";
  if ((MEDIA_LIMITS.video.mimes as readonly string[]).includes(mime)) return "video";
  return null;
}

/** Shared by client (friendly errors) and server (enforcement, RC-06). Returns an error message or null. */
export function validateMedia(kind: MediaKind, mime: string, bytes: number): string | null {
  const limits = MEDIA_LIMITS[kind];
  if (!(limits.mimes as readonly string[]).includes(mime)) {
    return kind === "image"
      ? "Unsupported image type. Please use a JPG, PNG, or WebP image."
      : "Unsupported video type. Please use an MP4 or MOV video.";
  }
  if (!Number.isFinite(bytes) || bytes <= 0) return "That file is empty.";
  if (bytes > limits.maxBytes) {
    const mb = Math.round(limits.maxBytes / 1024 / 1024);
    return `That ${kind} is too large. The limit is ${mb} MB for ${kind}s.`;
  }
  return null;
}

export function validateFile(file: File): { kind: MediaKind } | { error: string } {
  const kind = kindForMime(file.type);
  if (!kind) {
    return {
      error: "Unsupported file type. Images: JPG, PNG, WebP (up to 10 MB). Videos: MP4 or MOV (up to 100 MB).",
    };
  }
  const error = validateMedia(kind, file.type, file.size);
  return error ? { error } : { kind };
}
