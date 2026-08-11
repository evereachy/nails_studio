export const uploads = {
  maxFiles: 3,
  maxBytes: 1_600_000,
  maxSide: 1600,
  quality: 0.72,
  acceptMime: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  accept: "image/*",
} as const;
