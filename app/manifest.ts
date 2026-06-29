import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Chia tiền cầu lông`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    lang: "vi",
    background_color: "#fdf6ec",
    theme_color: "#ffb959",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" }
    ]
  };
}
