import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // DD-02: the permanent testimony URL is /@handle; `@` folders are parallel-route
  // slots in the App Router, so the page lives at /u/[handle].
  async rewrites() {
    return [{ source: "/@:handle", destination: "/u/:handle" }];
  },
};

export default nextConfig;
