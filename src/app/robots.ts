import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const base = rawBase.replace(/\/$/, "");

  // Prevent indexing on non-production builds if needed
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rules: [
      {
        userAgent: "*",
        allow: isProduction ? "/" : "",
        disallow: isProduction ? ["/api/", "/admin/"] : "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
