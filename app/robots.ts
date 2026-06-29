import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Chan crawl cac route can dang nhap / private de khong loang index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/b/", "/s/", "/api/"]
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
