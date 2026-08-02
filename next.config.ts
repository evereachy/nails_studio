import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Демо-картинки. Для продакшена заменить на свой CDN / /public.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
