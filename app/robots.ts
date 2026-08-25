import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/order/", "/restaurants/*/checkout"],
    },
    sitemap: "https://jetkiz.asia/sitemap.xml",
    host: "https://jetkiz.asia",
  };
}
