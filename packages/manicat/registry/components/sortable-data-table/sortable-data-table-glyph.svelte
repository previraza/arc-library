<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import { onMount } from "svelte";
  import { ArrowUp } from "@lucide/svelte";
  import { createSortGlyph } from "@/lib/sortable-data-table";

  /** The arrow fades in where a column becomes sorted and flips on a spring when the direction changes. */
  let { active, descending }: { active: boolean; descending: boolean } = $props();
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let arrow = $state<HTMLElement>();
  let update: ReturnType<typeof createSortGlyph> | undefined;
  onMount(() => {
    update = createSortGlyph(arrow!, { active, descending, reduced });
  });
  $effect(() => {
    const next = { active, descending };
    update?.(next);
  });
</script>

<span class="mc-sortable-data-table__sortIcon" aria-hidden="true">
  <ArrowUp class="mc-sortable-data-table__sortHint" size={16} strokeWidth={1.75} />
  <span bind:this={arrow} class="mc-sortable-data-table__sortArrow"><ArrowUp size={16} strokeWidth={1.75} /></span>
</span>
