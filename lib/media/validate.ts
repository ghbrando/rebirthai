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

export const MISSING_PHOTO_DESCRIPTION = "Add a description to every photo before publishing.";

/** Publish-time check of a stored object against its media row (RC-06, RC-11): the real stored type and
 *  size must be allowed for the row's kind, and images need alt text. Returns a plain message or null. */
export function checkStoredMedia(
  row: { kind: MediaKind; alt_text: string | null },
  stored: { size?: number | null; contentType?: string | null } | null,
): string | null {
  if (row.kind === "image" && !row.alt_text?.trim()) return MISSING_PHOTO_DESCRIPTION;
  const what = row.kind === "image" ? "A photo" : "A video";
  if (!stored || typeof stored.size !== "number" || !stored.contentType) {
    return `${what} in your story could not be found. Remove it and add it again, then publish.`;
  }
  const mime = stored.contentType.split(";")[0].trim().toLowerCase();
  const invalid = validateMedia(row.kind, mime, stored.size);
  return invalid ? `${what} in your story can't be published. ${invalid} Remove it and add it again.` : null;
}
