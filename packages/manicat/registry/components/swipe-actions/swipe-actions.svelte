<script lang="ts" module>
  export interface SwipeAction {
    label: string;
    tone?: "neutral" | "accent" | "danger";
    onSelect: () => void;
    /** Keep the row in place after the action runs instead of closing it. */
    keepRow?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    label: string;
    leading?: SwipeAction[];
    trailing?: SwipeAction[];
    /** The row. */
    children?: Snippet;
    /** Draws an action's icon. It receives the action's label. */
    icon?: Snippet<[string]>;
    /** Extend the inner, named parts of the row: row, content or action. */
    classNames?: { row?: string; content?: string; action?: string };
  }

  let { label, leading = [], trailing = [], children, icon, classNames }: Props = $props();

  const WIDTH = 84;
  let x = $state(0);
  let dragging = $state(false);
  let startX = 0;
  let startOffset = 0;

  const maxLeft = $derived(leading.length * WIDTH);
  const maxRight = $derived(trailing.length * WIDTH);

  function down(event: PointerEvent) {
    dragging = true;
    startX = event.clientX;
    startOffset = x;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent) {
    if (!dragging) return;
    x = Math.max(-maxRight, Math.min(maxLeft, startOffset + event.clientX - startX));
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    x = x > WIDTH / 2 && maxLeft ? maxLeft : x < -WIDTH / 2 && maxRight ? -maxRight : 0;
  }

  function run(action: SwipeAction) {
    action.onSelect();
    if (!action.keepRow) x = 0;
  }

  // Arrow keys reveal the actions, so the row is not pointer-only.
  function onKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" && maxRight) x = -maxRight;
    else if (event.key === "ArrowRight" && maxLeft) x = maxLeft;
    else if (event.key === "Escape") x = 0;
    else return;
    event.preventDefault();
  }
</script>

<div class={["mc-swipe", classNames?.row]} role="listitem" aria-label={label}>
  {#if leading.length}
    <div class="mc-swipe__strip mc-swipe__strip--leading">
      {#each leading as action (action.label)}
        <button type="button" class={["mc-swipe__action", classNames?.action]} data-tone={action.tone} onclick={() => run(action)}>{@render icon?.(action.label)}{action.label}</button>
      {/each}
    </div>
  {/if}
  {#if trailing.length}
    <div class="mc-swipe__strip mc-swipe__strip--trailing">
      {#each trailing as action (action.label)}
        <button type="button" class={["mc-swipe__action", classNames?.action]} data-tone={action.tone} onclick={() => run(action)}>{@render icon?.(action.label)}{action.label}</button>
      {/each}
    </div>
  {/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    class={["mc-swipe__content", classNames?.content]}
    role="group"
    tabindex="0"
    data-dragging={dragging || undefined}
    style="transform: translateX({x}px)"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onkeydown={onKeydown}
  >
    {@render children?.()}
  </div>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. Wrap rows in an element with role="list". */
.mc-swipe { position: relative; overflow: hidden; border-bottom: 1px solid var(--border); }
.mc-swipe__strip { position: absolute; top: 0; bottom: 0; display: flex; }
.mc-swipe__strip--leading { left: 0; } .mc-swipe__strip--trailing { right: 0; }
.mc-swipe__action { display: flex; width: 84px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: 0; background: var(--text-secondary); color: #fff; font: inherit; font-size: var(--text-xs); font-weight: 500; cursor: pointer; }
.mc-swipe__action[data-tone="accent"] { background: var(--accent); } .mc-swipe__action[data-tone="danger"] { background: var(--danger); }
.mc-swipe__content { position: relative; padding: var(--space-2) var(--space-4); background: var(--surface); touch-action: pan-y; transition: transform .28s var(--ease-standard); outline: none; }
.mc-swipe__content[data-dragging] { transition: none; cursor: grabbing; }
.mc-swipe__content:focus-visible { background: var(--surface-muted); }
@media (prefers-reduced-motion: reduce) { .mc-swipe__content { transition: none; } }
}
</style>
