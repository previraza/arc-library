import { demos } from "@/site/demos/registry";
import type { RegistryItem } from "@/lib/registry";

/**
 * The live preview of an item: the real component rendered from site/demos, not a screenshot.
 *
 * An item without a demo renders nothing so its page can still show the source and the API table.
 */
export function ItemPreview({ item }: { item: RegistryItem }) {
  const Demo = demos[item.name];
  if (!Demo) return null;

  return (
    <div
      className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-[var(--radius-surface)] border border-fd-border bg-fd-background p-8"
      style={{
        backgroundImage:
          "radial-gradient(color-mix(in oklab, var(--color-fd-foreground) 8%, transparent) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <div className="relative z-10 flex w-full max-w-md items-center justify-center">
        <Demo />
      </div>
    </div>
  );
}