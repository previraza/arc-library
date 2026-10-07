import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Manicat UI components live in packages/manicat and are plain TSX with CSS modules, so Next compiles them.
  transpilePackages: ["arc"],
};

const withMDX = createMDX();

export default withMDX(config);
