/**
 * Правила для фото-референсов.
 * Меняются здесь и действуют сразу на клиенте, сервере и в Telegram.
 */
export const uploads = {
  /** сколько фото можно приложить к одной записи */
  maxFiles: 3,
  /** предельный размер ОДНОГО фото после сжатия */
  maxBytes: 1_600_000,
  /** длинная сторона после ресайза, px */
  maxSide: 1600,
  /** качество JPEG при сжатии */
  quality: 0.72,
  /** что принимаем от пользователя (iPhone отдаёт heic) */
  acceptMime: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  /** значение атрибута accept у input */
  accept: "image/*",
} as const;