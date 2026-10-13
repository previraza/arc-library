import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { behindProxy } from "../viewer-shared/behind-proxy";
import { syncDemos } from "../viewer-shared/sync-demos";

const root = fileURLToPath(new URL("../../packages/manicat", import.meta.url));

// `@/registry/...` and `@/lib/...` resolve to the manicat package, exactly as they do once the ports are installed in a project.
// The docs site serves this viewer under /preview/svelte through a rewrite, so every URL starts with that base.
export default defineConfig({
  base: "/preview/svelte/",
  plugins: [behindProxy(), syncDemos("svelte"), svelte()],
  resolve: { alias: { "@": root } },
  server: { fs: { allow: [root, fileURLToPath(new URL("../..", import.meta.url))] } },
});
