import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Arc components live in packages/arc and are plain TSX with CSS modules, so Next compiles them.
  transpilePackages: ["arc"],
};

const withMDX = createMDX();

export default withMDX(config);
