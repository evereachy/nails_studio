import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Normalize base URL to ensure no trailing slash
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const base = rawBase.replace(/\/$/, "");

  // Define static routes
  const routes = ["", "/about", "/contact"].map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  return routes;
}
