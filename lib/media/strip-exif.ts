/** Re-encodes an image through a canvas, which drops EXIF/GPS and all other metadata (RC-06).
 *  Orientation is baked into the pixels first. Throws if it cannot (we never upload unstripped images). */
export async function stripImageMetadata(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, file.type, file.type === "image/png" ? undefined : 0.92),
    );
    if (!blob || blob.type !== file.type) throw new Error("Could not re-encode image");
    return new File([blob], file.name, { type: file.type });
  } finally {
    bitmap.close();
  }
}
