import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const script = fileURLToPath(new URL("../../packages/manicat/scripts/sync-usage-demos.mjs", import.meta.url));
const content = fileURLToPath(new URL("../docs/content/", import.meta.url));

/**
 * Keeps `src/demos` equal to the Usage snippets and Examples of the docs: synced when the server starts, and again whenever a
 * `<item>.<framework>.txt` or `<ExportName>.<framework>.txt` file changes, so editing a snippet shows up in the viewer at once.
 */
export function syncDemos(framework: string): Plugin {
  const run = () => spawnSync(process.execPath, [script, framework, "src/demos"], { stdio: "inherit" });
  return {
    name: "manicat:sync-demos",
    configureServer(server) {
      run();
      server.watcher.add([`${content}usage`, `${content}examples`]);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const changed = (file: string) => {
        if (!file.endsWith(`.${framework}.txt`)) return;
        clearTimeout(timer);
        timer = setTimeout(run, 150);
      };
      for (const event of ["add", "change", "unlink"] as const) server.watcher.on(event, changed);
    },
  };
}
