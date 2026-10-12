import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Manicat UI components live in packages/manicat and are plain TSX with CSS modules, so Next compiles them.
  transpilePackages: ["arc"],
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    turbopackFileSystemCacheForDev: true,
  }
};

const withMDX = createMDX();

export default withMDX(config);
