<script lang="ts" module>
  import type { CardDecision } from "@/lib/card-stack";

  export type { CardDecision };
</script>

<script lang="ts" generics="T">
  // @manicat-dependencies motion @lucide/svelte
  import type { Snippet } from "svelte";
  import { onDestroy, untrack } from "svelte";
  import { Check, RotateCcw, X } from "@lucide/svelte";
  import CardStackCard from "@/registry/components/card-stack/card-stack-card.svelte";
  import { FLICK, VISIBLE, createLift } from "@/lib/card-stack";
  import type { Exit, Point, Return } from "@/lib/card-stack";
  import { poseTransition } from "@/lib/motion-dom";
  import { motionTokens } from "@/lib/motion-tokens";

  /**
   * A deck of cards reviewed one at a time: drag or flick the top card left or right, or use the buttons and arrow keys.
   * Use it for quick, one-by-one triage where each item deserves a moment of attention: shortlisting destinations, candidates, or design options.
   * Use a list or table when people need to compare items side by side. The `card` snippet renders one card and `empty` the end state.
   */
  interface Props {
    items: T[];
    getKey: (item: T) => string;
    /** A short name for the card, used in its accessible label and announcements, such as "Lisbon". */
    getLabel: (item: T) => string;
    card: Snippet<[T]>;
    /** Shown once every card has been decided. Receives a function that brings all cards back. */
    empty?: Snippet<[() => void]>;
    ondecide?: (item: T, decision: CardDecision) => void;
    onundo?: (item: T, decision: CardDecision) => void;
    onreset?: () => void;
    /** Action names for each side, used on the buttons and the stamps that appear while dragging. */
    labels?: { left: string; right: string };
    /** Past tense of each action for announcements, such as "skipped" and "shortlisted". */
    outcomes?: { left: string; right: string };
    /** Accessible name for the stack. */
    label?: string;
    /** Extend the inner, named parts of the card stack: root, stage, empty, control, controlLabel or emptyTitle. */
    classNames?: { root?: string; stage?: string; empty?: string; control?: string; controlLabel?: string; emptyTitle?: string };
  }

  let { items, getKey, getLabel, card, empty: emptySlot, ondecide, onundo, onreset, labels = { left: "Pass", right: "Keep" }, outcomes, label = "Cards", classNames }: Props = $props();

  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cn = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base);
  const hintId = $props.id();

  let position = $state(0);
  let history = $state.raw<{ key: string; decision: CardDecision }[]>([]);
  let flying = $state.raw<string[]>([]);
  let returning = $state.raw<Record<string, Return>>({});
  let message = $state("");
  const lift = createLift();
  // Where each thrown card left the screen, so undo and start over can bring it back from there.
  const exits: Record<string, Exit> = {};
  const flings = new Map<string, Point>();
  const top = $derived(items[position]);
  const remaining = $derived(Math.max(0, items.length - position));
  onDestroy(() => lift.stop());

  function decide(decision: CardDecision) {
    const item = top;
    if (!item) return;
    const key = getKey(item);
    lift.set(0);
    position += 1;
    history = [...history, { key, decision }];
    flying = [...flying, key];
    returning = {};
    const left = remaining;
    message = `${getLabel(item)}${outcomes ? ` ${outcomes[decision]}` : `: ${labels[decision]}`}. ${left ? `${left} left.` : "All cards reviewed."}`;
    ondecide?.(item, decision);
  }

  function undo() {
    const last = history[history.length - 1];
    const item = last && items.find((entry) => getKey(entry) === last.key);
    if (!last || !item) return;
    const exit = exits[last.key];
    position -= 1;
    history = history.slice(0, -1);
    flying = flying.filter((key) => key !== last.key);
    returning = exit ? { [last.key]: { ...exit, delay: 0 } } : {};
    message = `${getLabel(item)} restored.`;
    onundo?.(item, last.decision);
  }

  function reset() {
    if (!history.length) return;
    // The deck deals itself back: the card that will sit deepest returns first, the top card last.
    const count = Math.min(VISIBLE, items.length);
    const back: Record<string, Return> = {};
    items.slice(0, count).forEach((item, index) => {
      const key = getKey(item);
      const exit = exits[key];
      if (exit && index < position) back[key] = { ...exit, delay: (count - 1 - index) * 0.06 };
    });
    position = 0;
    history = [];
    flying = [];
    returning = back;
    message = "All cards are back in the stack.";
    onreset?.();
  }

  function release(key: string, offset: Point, velocity: Point, width: number) {
    const direction = Math.sign(offset.x);
    const item = top;
    if (!direction || !item || getKey(item) !== key) return false;
    const flick = Math.abs(velocity.x) > FLICK && Math.sign(velocity.x) === direction && Math.abs(offset.x) > 12;
    const far = Math.abs(offset.x) > Math.min(width * 0.35, 140) && !(Math.sign(velocity.x) === -direction && Math.abs(velocity.x) > 300);
    if (!flick && !far) return false;
    flings.set(key, velocity);
    decide(direction > 0 ? "right" : "left");
    return true;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      decide(event.key === "ArrowRight" ? "right" : "left");
    } else if (event.key === "Backspace" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z")) {
      event.preventDefault();
      undo();
    }
  }

  const decided = $derived(new Map(history.map((entry) => [entry.key, entry.decision])));
  const rendered = $derived.by(() => {
    const windowKeys = new Set(items.slice(position, position + VISIBLE).map(getKey));
    return items.filter((item) => windowKeys.has(getKey(item)) || flying.includes(getKey(item)));
  });
  const empty = $derived(position >= items.length && flying.length === 0);
  const fling = (key: string) => {
    const velocity = flings.get(key);
    flings.delete(key);
    return velocity;
  };
  const onThrown = (key: string, exit: Exit) => { exits[key] = exit; };
  const onGone = (key: string) => { flying = flying.filter((entry) => entry !== key); };

  // The end state blurs in and leaves quickly.
  const { blur, duration } = motionTokens;
  const emptyIn = poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: 8, blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: 0.15, ease: "standard" } : { duration: duration.standard, ease: "enter" });
  const emptyOut = poseTransition({ opacity: 0 }, { opacity: 1 }, { duration: duration.instant });
  void untrack;
</script>

<div class={cn("mc-card-stack__root", classNames?.root)}>
  <div class={cn("mc-card-stack__stage", classNames?.stage)} role="group" aria-roledescription="card stack" aria-label={label} aria-describedby={hintId} tabindex="0" onkeydown={onKeydown}>
    {#each rendered as item (getKey(item))}
      {@const key = getKey(item)}
      {@const index = items.indexOf(item)}
      {@const decision = decided.get(key) ?? null}
      <CardStackCard
        id={key}
        depth={decision ? 0 : index - position}
        {decision}
        returnFrom={returning[key]}
        interactive={!decision && index - position === 0}
        zIndex={decision ? 20 + flying.indexOf(key) : VISIBLE - (index - position)}
        label={`${getLabel(item)}, ${index + 1} of ${items.length}`}
        {labels}
        {lift}
        {reduced}
        {fling}
        onRelease={release}
        {onThrown}
        {onGone}
      >{@render card(item)}</CardStackCard>
    {/each}
    {#if empty}
      <div class={cn("mc-card-stack__empty", classNames?.empty)} in:emptyIn out:emptyOut>
        {#if emptySlot}{@render emptySlot(reset)}{:else}
          <p class={cn("mc-card-stack__emptyTitle", classNames?.emptyTitle)}>All cards reviewed</p>
          <button type="button" class="mc-card-stack__control" onclick={reset}><RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />Start over</button>
        {/if}
      </div>
    {/if}
  </div>
  <div class="mc-card-stack__controls">
    <button type="button" class={cn("mc-card-stack__control", classNames?.control)} aria-disabled={!top || undefined} onclick={() => { if (top) decide("left"); }}><X size={16} strokeWidth={1.75} aria-hidden="true" />{labels.left}</button>
    <button type="button" class={cn("mc-card-stack__control", classNames?.control)} data-tone="quiet" aria-disabled={!history.length || undefined} onclick={() => { if (history.length) undo(); }}><RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" /><span class={cn("mc-card-stack__controlLabel", classNames?.controlLabel)}>Undo</span></button>
    <button type="button" class={cn("mc-card-stack__control", classNames?.control)} data-tone="primary" aria-disabled={!top || undefined} onclick={() => { if (top) decide("right"); }}><Check size={16} strokeWidth={1.75} aria-hidden="true" />{labels.right}</button>
  </div>
  <p id={hintId} class="mc-card-stack__srOnly">Drag the top card, or use the left and right arrow keys to {labels.left.toLowerCase()} or {labels.right.toLowerCase()} it. Backspace undoes the last decision.</p>
  <p class="mc-card-stack__srOnly" role="status" aria-live="polite">{message}</p>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-card-stack__root { --card-height: 19rem; --stack-peek: 24px; display: grid; width: 100%; justify-items: center; gap: var(--space-5); font-family: var(--font-body); letter-spacing: var(--tracking-body); }

/* The stage reserves the top card plus the edges peeking out below it, so nothing reflows as cards come and go. */
.mc-card-stack__stage { position: relative; isolation: isolate; width: min(100%, 20rem); height: calc(var(--card-height) + var(--stack-peek)); outline: none; }
/* Each slot scales from its bottom edge, so the cards behind show a thin, even edge below the one in front. */
.mc-card-stack__slot { position: absolute; top: 0; right: 0; left: 0; height: var(--card-height); pointer-events: none; transform-origin: 50% 100%; }
.mc-card-stack__card { position: absolute; inset: 0; border-radius: var(--radius-surface); pointer-events: auto; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.mc-card-stack__card[data-top] { cursor: grab; }
.mc-card-stack__card[data-dragging] { cursor: grabbing; }
.mc-card-stack__card:not([data-top]) { pointer-events: none; }
/* Resting cards sit flat on their borders; a card in the hand or in flight floats and casts a shadow. */
.mc-card-stack__card::before { position: absolute; inset: 0; border-radius: inherit; box-shadow: var(--shadow-floating); content: ""; opacity: 0; pointer-events: none; transition: opacity var(--duration-fast) var(--ease-standard); }
.mc-card-stack__card[data-dragging]::before, .mc-card-stack__card[data-flying]::before { opacity: 1; }
.mc-card-stack__face { position: relative; height: 100%; overflow: hidden; border: 1px solid var(--border); border-radius: inherit; background: var(--surface); color: var(--foreground); }
.mc-card-stack__shade { position: absolute; inset: 0; background: oklch(0% 0 0 / .035); pointer-events: none; }
:root[data-theme="dark"] .mc-card-stack__shade { background: oklch(0% 0 0 / .22); }

.mc-card-stack__stamp { position: absolute; top: var(--space-4); display: inline-flex; height: 2rem; align-items: center; gap: 6px; padding: 0 var(--space-3) 0 10px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-raised); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; white-space: nowrap; pointer-events: none; }
.mc-card-stack__stamp[data-side="right"] { left: var(--space-4); border-color: color-mix(in oklab, var(--success) 32%, var(--border)); background: color-mix(in oklab, var(--success) 9%, var(--surface-raised)); }
.mc-card-stack__stamp[data-side="right"] svg { color: var(--success); }
.mc-card-stack__stamp[data-side="left"] { right: var(--space-4); }
.mc-card-stack__stamp[data-side="left"] svg { color: var(--text-secondary); }
/* Cards returning to the back of the stack carry no verdict. */
.mc-card-stack__card:not([data-top]):not([data-flying]) .mc-card-stack__stamp { visibility: hidden; }

.mc-card-stack__stage:focus-visible .mc-card-stack__card[data-top], .mc-card-stack__stage:focus-visible .mc-card-stack__empty { outline: 2px solid var(--focus-ring); outline-offset: 3px; }

.mc-card-stack__empty { position: absolute; top: 0; right: 0; left: 0; display: grid; height: var(--card-height); place-content: center; justify-items: center; gap: var(--space-3); padding: var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-surface); background: var(--surface); text-align: center; }
.mc-card-stack__emptyTitle { margin: 0; font-size: var(--text-base); font-weight: 500; }

.mc-card-stack__controls { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2); }
.mc-card-stack__control { display: inline-flex; min-height: var(--control-height-md); align-items: center; justify-content: center; gap: var(--space-2); padding: 0 var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard); }
.mc-card-stack__control svg { flex: none; }
/* The approving action follows the selected accent. */
.mc-card-stack__control[data-tone="primary"] { border-color: var(--accent); background: var(--accent); color: var(--accent-foreground); }
.mc-card-stack__control[data-tone="quiet"] { border-color: transparent; background: transparent; color: var(--text-secondary); }
@media (hover: hover) and (pointer: fine) {
  .mc-card-stack__control:not([aria-disabled]):hover { background: var(--surface-muted); }
  .mc-card-stack__control[data-tone="primary"]:not([aria-disabled]):hover { border-color: var(--accent-strong); background: var(--accent-strong); }
  .mc-card-stack__control[data-tone="quiet"]:not([aria-disabled]):hover { color: var(--foreground); }
}
.mc-card-stack__control:not([aria-disabled]):active { background: var(--surface-muted); }
.mc-card-stack__control[data-tone="primary"]:not([aria-disabled]):active { border-color: var(--accent-strong); background: var(--accent-strong); }
.mc-card-stack__control[aria-disabled] { cursor: default; opacity: .42; }
.mc-card-stack__control:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.mc-card-stack__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (max-width: 26rem) {
  .mc-card-stack__root { --card-height: 17.5rem; gap: var(--space-4); }
  .mc-card-stack__controls { flex-wrap: nowrap; }
  .mc-card-stack__control { padding-inline: var(--space-3); }
}
/* On the narrowest screens Undo keeps its icon and its accessible name, so all three controls stay on one row. */
@media (max-width: 22.5rem) {
  .mc-card-stack__control[data-tone="quiet"] { width: var(--control-height-md); padding: 0; }
  .mc-card-stack__control[data-tone="quiet"] .mc-card-stack__controlLabel { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}

@media (prefers-reduced-motion: reduce) {
  .mc-card-stack__card::before, .mc-card-stack__control { transition: none; }
}
}
</style>
