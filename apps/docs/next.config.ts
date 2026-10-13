import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Manicat UI components live in packages/manicat and are plain TSX with CSS modules, so Next compiles them.
  transpilePackages: ["arc"],
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    turbopackFileSystemCacheForDev: true,
  },
  allowedDevOrigins: ['ds.viraza.net'],
  // The avatar demos use portraits from pravatar.cc.
  async rewrites() {
    return {
      beforeFiles: Object.entries(viewers).flatMap(([name, origin]) => [
        { source: `/preview/${name}`, destination: `${origin}/preview/${name}/` },
        { source: `/preview/${name}/:path*`, destination: `${origin}/preview/${name}/:path*` },
      ]),
      afterFiles: [],
      fallback: [],
    };
  },
  images: { remotePatterns: [{ protocol: "https", hostname: "i.pravatar.cc" }] },
};

// The Vue, Svelte and React Native viewers run as their own servers. The docs frame them from /preview/<framework>, so a visitor
// only needs this site to be reachable. `pnpm dev` serves them on 3001 to 3003; point VIEWER_ORIGIN_<ID> elsewhere on a deploy.
const viewers = {
  svelte: process.env.VIEWER_ORIGIN_SVELTE ?? "http://localhost:3001",
  vue: process.env.VIEWER_ORIGIN_VUE ?? "http://localhost:3002",
  "react-native": process.env.VIEWER_ORIGIN_REACT_NATIVE ?? "http://localhost:3003",
};

const withMDX = createMDX();

export default withMDX(config);
