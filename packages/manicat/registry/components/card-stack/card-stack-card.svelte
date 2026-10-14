<script lang="ts">
  // @manicat-dependencies motion @lucide/svelte
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { Check, X } from "@lucide/svelte";
  import type { MotionValue } from "motion";
  import { createStackCard } from "@/lib/card-stack";
  import type { CardDecision, Exit, Point, Return } from "@/lib/card-stack";

  let { id, depth, decision, returnFrom, interactive, zIndex, label, labels, lift, reduced, fling, onRelease, onThrown, onGone, children }: {
    id: string;
    depth: number;
    decision: CardDecision | null;
    returnFrom?: Return;
    interactive: boolean;
    zIndex: number;
    label: string;
    labels: { left: string; right: string };
    lift: MotionValue<number>;
    reduced: boolean;
    fling: (id: string) => Point | undefined;
    onRelease: (id: string, offset: Point, velocity: Point, width: number) => boolean;
    onThrown: (id: string, exit: Exit) => void;
    onGone: (id: string) => void;
    children?: Snippet;
  } = $props();

  let slot = $state<HTMLElement>();
  let card = $state<HTMLElement>();
  let controller = $state.raw<ReturnType<typeof createStackCard>>();
  onMount(() => {
    const made = createStackCard({ slot: slot!, card: card! }, {
      id,
      reduced,
      lift,
      state: () => ({ depth, decision, returnFrom, interactive }),
      fling: (key) => fling(key),
      onRelease: (key, offset, velocity, width) => onRelease(key, offset, velocity, width),
      onThrown: (key, exit) => onThrown(key, exit),
      onGone: (key) => onGone(key),
    });
    controller = made;
    made.update();
    return () => made.destroy();
  });
  $effect(() => {
    void [depth, decision, returnFrom, interactive];
    controller?.update();
  });
</script>

<div bind:this={slot} class="mc-card-stack__slot" style:z-index={zIndex} aria-hidden={interactive ? undefined : true} inert={!interactive}>
  <div bind:this={card} class="mc-card-stack__card" data-top={interactive ? "" : undefined} data-flying={decision !== null ? "" : undefined} role={interactive ? "group" : undefined} aria-label={interactive ? label : undefined}>
    <div class="mc-card-stack__face">
      {@render children?.()}
      <span class="mc-card-stack__shade" data-shade aria-hidden="true"></span>
    </div>
    <span class="mc-card-stack__stamp" data-side="right" data-stamp="right" aria-hidden="true"><Check size={16} strokeWidth={2} />{labels.right}</span>
    <span class="mc-card-stack__stamp" data-side="left" data-stamp="left" aria-hidden="true"><X size={16} strokeWidth={2} />{labels.left}</span>
  </div>
</div>
