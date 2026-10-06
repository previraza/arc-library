import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * The Arc package root, found by walking up from the working directory until `packages/arc` shows up.
 *
 * The registry stores paths relative to that root (registry/components/…, lib/…), so reading a source file means
 * resolving it against the package rather than against this app. Walking up keeps it correct whatever the current
 * directory is: `next dev`, `next build`, or a script run from the repository root.
 */
function findArcRoot(): string {
  let dir = process.cwd();

  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = join(dir, "packages", "arc");
    if (existsSync(join(candidate, "registry.json"))) return candidate;

    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Fall back to the layout of this repository rather than failing the build.
  return join(process.cwd(), "..", "..", "packages", "arc");
}

export const arcRoot = findArcRoot();