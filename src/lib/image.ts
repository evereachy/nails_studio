import { uploads } from "@/config/uploads";
import type { BookingPhoto } from "@/types";

/**
 * Сжатие фото В БРАУЗЕРЕ, до отправки.
 * Снимок с телефона весит 4–8 МБ; по мобильному интернету такая отправка
 * висит десятками секунд и часто отваливается. После ресайза до 1600px
 * и JPEG 0.72 остаётся 200–400 КБ — уходит почти мгновенно,
 * а качества хватает, чтобы мастер разглядел оттенок и длину.
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
  if (!ctx) throw new Error("Не удалось обработать изображение");

  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap) bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", uploads.quality);

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    dataUrl,
    size: Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75),
  };
}

/**
 * imageOrientation: "from-image" — иначе фото с iPhone,
 * снятые вертикально, приезжают повёрнутыми на 90°.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Safari старых версий не знает опцию — падаем на <img>
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

/** Проверка до сжатия — чтобы не гонять через canvas заведомо чужой формат. */
export function isSupportedImage(file: File) {
  return file.type.startsWith("image/");
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}