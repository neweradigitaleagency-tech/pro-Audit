import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProAudit",
    short_name: "ProAudit",
    description: "Audit superviseur Prosuma",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#ED7D31",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  }
}
