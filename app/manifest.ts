import type { MetadataRoute } from "next";

// Installable web app (#12, RC-14). No service worker or offline mode: out of scope.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RebirthAI",
    short_name: "RebirthAI",
    description: "Tell your testimony with an AI coach and carry it on your contact card.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    theme_color: "#7a2e3a",
    background_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
