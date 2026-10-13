import { demos } from "@/site/demos/registry";
import { PreviewShell } from "@/site/library/preview-shell";
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
    <PreviewShell label={`${item.title} preview`}>
      <Demo />
    </PreviewShell>
  );
}
