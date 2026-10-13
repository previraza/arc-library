<script lang="ts">
  interface Props {
    value: string | number;
    /** Formats a numeric value before it is shown, such as `(n) => n.toLocaleString()`. */
    format?: (value: number) => string;
    /** Seconds one character takes to roll. */
    duration?: number;
    /** Extend the inner, named parts of the slot text: reels, slot or cell. */
    classNames?: { reels?: string; slot?: string; cell?: string };
  }

  let { value, format, duration = 0.6, classNames }: Props = $props();

  const text = $derived(typeof value === "number" ? (format ? format(value) : value.toLocaleString()) : value);
  const chars = $derived(Array.from(text));
</script>

<!-- svelte-ignore a11y_unknown_role -->
<span class={["mc-slot", classNames?.reels]} role="text" aria-label={text}>
  <!-- Keyed from the end, so a digit gained on the left does not make every column roll. -->
  {#each chars as char, index (chars.length - index)}
    <span aria-hidden="true" class={["mc-slot__cell", classNames?.slot]} style="--mc-index: {index}; --mc-duration: {duration}s">
      {#key char}<span class={["mc-slot__char", classNames?.cell]}>{char}</span>{/key}
    </span>
  {/each}
</span>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-slot { display: inline-flex; overflow: hidden; font-variant-numeric: tabular-nums; }
.mc-slot__cell { display: inline-block; }
.mc-slot__char { display: inline-block; animation: mc-slot-roll var(--mc-duration, .6s) var(--ease-enter) calc(var(--mc-index) * 60ms) both; }
@keyframes mc-slot-roll { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-slot__char { animation: none; } }
}
</style>
