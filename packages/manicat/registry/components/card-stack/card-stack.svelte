<script lang="ts" module>
  export type CardDecision = "left" | "right";
</script>

<script lang="ts" generics="T">
  import type { Snippet } from "svelte";

  interface Props {
    items: T[];
    getKey: (item: T) => string;
    getLabel: (item: T) => string;
    labels?: { left: string; right: string };
    outcomes?: { left: string; right: string };
    label?: string;
    ondecide?: (item: T, decision: CardDecision) => void;
    onundo?: (item: T, decision: CardDecision) => void;
    onreset?: () => void;
    /** Draws a card from its item. */
    card: Snippet<[T]>;
    /** Shown when every card is decided. It receives `reset`. */
    empty?: Snippet<[() => void]>;
    /** Extend the inner, named parts of the stack: card, button or status. */
    classNames?: { card?: string; button?: string; status?: string };
  }

  let { items, getKey, getLabel, labels = { left: "Skip", right: "Keep" }, outcomes = { left: "skipped", right: "kept" }, label = "Cards", ondecide, onundo, onreset, card, empty, classNames }: Props = $props();

  let history = $state.raw<{ item: T; decision: CardDecision }[]>([]);
  let dx = $state(0);
  let dragging = $state(false);
  let startX = 0;

  const queue = $derived.by(() => {
    const done = new Set(history.map((entry) => getKey(entry.item)));
    return items.filter((item) => !done.has(getKey(item)));
  });
  const top = $derived(queue[0]);
  const last = $derived(history[history.length - 1]);

  function decide(decision: CardDecision) {
    const item = top;
    if (!item) return;
    dx = decision === "right" ? 420 : -420;
    setTimeout(() => {
      history = [...history, { item, decision }];
      dx = 0;
      ondecide?.(item, decision);
    }, 180);
  }

  function undo() {
    const entry = last;
    if (!entry) return;
    history = history.slice(0, -1);
    onundo?.(entry.item, entry.decision);
  }

  function reset() {
    history = [];
    onreset?.();
  }

  function down(event: PointerEvent) {
    dragging = true;
    startX = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent) {
    if (dragging) dx = event.clientX - startX;
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    if (dx > 90) decide("right");
    else if (dx < -90) decide("left");
    else dx = 0;
  }

  // Arrow keys decide and Backspace undoes, so the deck is not pointer-only.
  function onKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") decide("right");
    else if (event.key === "ArrowLeft") decide("left");
    else if (event.key === "Backspace") undo();
    else return;
    event.preventDefault();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<section class="mc-deck" aria-label={label} tabindex="0" onkeydown={onKeydown}>
  <div class="mc-deck__stage">
    {#if !top}
      {#if empty}{@render empty(reset)}{:else}<button type="button" class="mc-deck__empty" onclick={reset}>All done. Start over</button>{/if}
    {:else}
      {#if queue[1]}<div class={["mc-deck__card", "mc-deck__card--behind", classNames?.card]}>{@render card(queue[1])}</div>{/if}
      {#key getKey(top)}
        <div class={["mc-deck__card", classNames?.card]} role="presentation" data-dragging={dragging || undefined} style="transform: translateX({dx}px) rotate({dx / 25}deg)" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
          {@render card(top)}
        </div>
      {/key}
    {/if}
  </div>
  <div class="mc-deck__buttons">
    <button type="button" class={["mc-deck__button", classNames?.button]} disabled={!top} onclick={() => decide("left")}>← {labels.left}</button>
    <button type="button" class={["mc-deck__button", classNames?.button]} disabled={!top} onclick={() => decide("right")}>{labels.right} →</button>
    <button type="button" class="mc-deck__undo" disabled={!last} onclick={undo}>Undo</button>
  </div>
  <p class={["mc-deck__status", classNames?.status]} aria-live="polite">{last ? `${getLabel(last.item)} ${outcomes[last.decision]}` : " "}</p>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-deck { display: grid; gap: var(--space-3); outline: none; }
.mc-deck__stage { position: relative; display: grid; min-height: 200px; align-items: center; }
.mc-deck__card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); touch-action: pan-y; cursor: grab; transition: transform .22s var(--ease-standard); }
.mc-deck__card[data-dragging] { transition: none; cursor: grabbing; }
.mc-deck__card--behind { position: absolute; inset: 8px 10px auto; opacity: .6; transform: scale(.97); pointer-events: none; }
.mc-deck__empty { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-sm); cursor: pointer; }
.mc-deck__buttons { display: flex; align-items: center; justify-content: center; gap: var(--space-3); }
.mc-deck__button { min-height: var(--control-height-sm); padding: 0 var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-deck__button:hover:not(:disabled) { background: var(--surface-muted); } }
.mc-deck__button:disabled, .mc-deck__undo:disabled { opacity: .4; cursor: not-allowed; }
.mc-deck__undo { border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-deck__status { min-height: 1.2em; margin: 0; color: var(--text-muted); font-size: var(--text-xs); text-align: center; }
@media (prefers-reduced-motion: reduce) { .mc-deck__card { transition: none; } }
}
</style>
