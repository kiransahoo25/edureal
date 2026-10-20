import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduReal - Find & Book Tutors",
    short_name: "EduReal",
    description: "Connect with expert teachers for physical classes near you.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#020617", // Matches your Spatial UI dark background
    theme_color: "#2563eb", // Matches your blue buttons
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
