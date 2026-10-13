import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { behindProxy } from "../viewer-shared/behind-proxy";

const root = fileURLToPath(new URL("../../packages/manicat", import.meta.url));

// `@/registry/...` and `@/lib/...` resolve to the manicat package, exactly as they do once the ports are installed in a project.
// The docs site serves this viewer under /preview/svelte through a rewrite, so every URL starts with that base.
export default defineConfig({
  base: "/preview/svelte/",
  plugins: [behindProxy(), svelte()],
  resolve: { alias: { "@": root } },
  server: { fs: { allow: [root, fileURLToPath(new URL("..", import.meta.url))] } },
});
