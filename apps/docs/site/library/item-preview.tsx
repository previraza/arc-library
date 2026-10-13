import { demos } from "@/site/demos/registry";
import { PreviewShell } from "@/site/library/preview-shell";
import { frameworksOf } from "@/lib/frameworks";
import type { RegistryItem } from "@/lib/registry";
import { FrameworkPreview } from "@/site/library/framework-preview";

/**
 * The live preview of an item: the real component rendered from site/demos, not a screenshot.
 *
 * An item without a demo renders nothing so its page can still show the source and the API table.
 */
export function ItemPreview({ item }: { item: RegistryItem }) {
  const Demo = demos[item.name];
  if (!Demo) return null;

  return (
    <FrameworkPreview name={item.name} options={frameworksOf(item)}>
      <PreviewShell label={`${item.title} preview`} frameSrc={`/frame/demo/${item.name}`}>
        <Demo />
      </PreviewShell>
    </FrameworkPreview>
  );
}
