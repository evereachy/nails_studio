import { uploads } from "@/config/uploads";
import type { BookingPhoto } from "@/types";

/**
 * Client-side image compression prior to uploading.
 * Scales image to maximum maxSide (e.g., 1600px) and applies JPEG quality compression.
 */
export async function compressImage(file: File): Promise<BookingPhoto> {
  const bitmap = await decode(file);

  const scale = Math.min(1, uploads.maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is not available");

  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  const dataUrl = canvas.toDataURL("image/jpeg", uploads.quality);
  const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    id: uniqueId,
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    dataUrl,
    size: Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75),
  };
}

/**
 * Handles image orientation automatically for iOS devices via createImageBitmap.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall back to Image element if createImageBitmap options are unsupported
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function isSupportedImage(file: File): boolean {
  return file.type.startsWith("image/");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
