import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { arcRoot } from "@/lib/arc-root";
import { selfLink } from "@/lib/registry";

/**
 * Serves the published registry items from packages/arc/public/r, the single place the shadcn payload is written.
 *
 * The payloads hardcode upstream origins for their registryDependencies; re-pointing them here keeps an install
 * from this site self-contained instead of pulling foundation files from another host.
 */
const registryRoot = join(arcRoot, "public", "r");

type Params = { params: Promise<{ name: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { name } = await params;

  // Item names are lowercase kebab-case, with an optional .json the CLI appends, so anything else is a 404
  // rather than a path traversal attempt.
  const item = name.endsWith(".json") ? name.slice(0, -".json".length) : name;
  if (!/^[a-z0-9-]+$/.test(item)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = join(registryRoot, `${item}.json`);
  if (!existsSync(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const payload = JSON.parse(readFileSync(file, "utf8")) as {
    registryDependencies?: string[];
    docs?: string;
    meta?: { docs?: string };
  };

  if (Array.isArray(payload.registryDependencies)) {
    payload.registryDependencies = payload.registryDependencies.map(selfLink);
  }
  if (payload.docs) payload.docs = selfLink(payload.docs);
  if (payload.meta?.docs) payload.meta.docs = selfLink(payload.meta.docs);

  return NextResponse.json(payload, {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}