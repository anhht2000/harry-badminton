import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Chi liet ke route cong khai, on dinh. Trang nhom/buoi can dang nhap nen khong dua vao.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1
    }
  ];
}
