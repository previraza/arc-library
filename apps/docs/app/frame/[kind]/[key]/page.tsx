import { createElement } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demos } from "@/site/demos/registry";
import { findExample } from "@/site/examples/registry";

type Params = { kind: string; key: string };

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * A single demo or example on a blank page. The docs load it in an iframe inside the phone preview, so the example
 * sees the phone's real width: its media and container queries answer to the device, not to the page around it.
 *
 *   /frame/demo/<item>            the main preview of an item
 *   /frame/example/<ExportName>   one example, by its export name
 */
function resolve(kind: string, key: string) {
  const component = kind === "demo" ? demos[key] : kind === "example" ? findExample(key) : undefined;
  return component && createElement(component);
}

export default async function FramePage(props: { params: Promise<Params> }) {
  const { kind, key } = await props.params;
  const content = resolve(kind, key);
  if (!content) notFound();

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="flex w-full max-w-2xl items-center justify-center">
        {content}
      </div>
    </main>
  );
}
