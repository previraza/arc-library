<script lang="ts">
  // @manicat-dependencies motion
  import type { MotionValue } from "motion";
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { createPanelMotion } from "@/lib/expanding-search";

  /** The panel shares the field's width value, so on first open it unfolds out of the field; afterwards only its height follows the content. */
  type Transition = (node: HTMLElement) => { duration?: number; delay?: number; easing?: (t: number) => number; css?: (t: number) => string };
  let { width, reduced, classNames, children, panelIn, panelOut }: { width: MotionValue<number>; reduced: boolean; classNames?: Record<string, string | undefined>; children?: Snippet; panelIn: Transition; panelOut: Transition } = $props();
  let panel = $state<HTMLElement>();
  let body = $state<HTMLElement>();
  onMount(() => createPanelMotion(panel!, body!, width, reduced));
  const cn = (base: string, key: string) => (classNames?.[key] ? `${base} ${classNames[key]}` : base);
</script>

<div bind:this={panel} class={cn("mc-expanding-search__panel", "panel")} in:panelIn|global out:panelOut|global>
  <div bind:this={body} class={cn("mc-expanding-search__body", "body")}>{@render children?.()}</div>
</div>
