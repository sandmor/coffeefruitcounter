import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack ignores the 'webpack' function.
  // We do NOT add a 'turbo' block here because Turbopack
  // does not support 'asyncWebAssembly' compilation rules yet.

  // Headers for WASM files (required for SharedArrayBuffer if using threads)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },

  // Output configuration for static export (useful for Vercel)
  output: "standalone",
};

export default nextConfig;
