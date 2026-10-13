<script lang="ts">
  interface Props {
    label: string;
    confirmedLabel?: string;
    /** Milliseconds the press must last. */
    duration?: number;
    tone?: "accent" | "danger" | "neutral";
    confirmed?: boolean;
    disabled?: boolean;
    onconfirm?: () => void;
    onholdchange?: (holding: boolean) => void;
    /** Extend the inner, named parts of the button: fill or label. */
    classNames?: { fill?: string; label?: string };
  }

  let { label, confirmedLabel = "Done", duration = 1200, tone = "accent", confirmed, disabled = false, onconfirm, onholdchange, classNames }: Props = $props();

  let progress = $state(0);
  let done = $state(false);
  const finished = $derived(confirmed ?? done);
  let frame = 0;
  let started = 0;
  let holding = false;

  function tick(now: number) {
    progress = Math.min(1, (now - started) / duration);
    if (progress >= 1) {
      holding = false;
      done = true;
      onholdchange?.(false);
      onconfirm?.();
    } else frame = requestAnimationFrame(tick);
  }

  function start() {
    if (disabled || finished || holding) return;
    holding = true;
    onholdchange?.(true);
    started = performance.now() - progress * duration;
    frame = requestAnimationFrame(tick);
  }

  function cancel() {
    if (!holding) return;
    holding = false;
    cancelAnimationFrame(frame);
    onholdchange?.(false);
    progress = 0;
  }

  // Holding Space or Enter works like a press, so the control is not pointer-only.
  function onKeydown(event: KeyboardEvent) {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      start();
    }
  }

  $effect(() => () => cancelAnimationFrame(frame));
</script>

<button
  type="button"
  class={["mc-hold", `mc-hold--${tone}`]}
  {disabled}
  data-done={finished || undefined}
  aria-label={finished ? confirmedLabel : `${label}, press and hold`}
  onpointerdown={start}
  onpointerup={cancel}
  onpointerleave={cancel}
  onpointercancel={cancel}
  onkeydown={onKeydown}
  onkeyup={cancel}
  onblur={cancel}
>
  <span class={["mc-hold__fill", classNames?.fill]} style="transform: scaleX({finished ? 1 : progress})" aria-hidden="true"></span>
  <span class={["mc-hold__label", classNames?.label]}>{finished ? confirmedLabel : label}</span>
</button>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-hold { --mc-tone: var(--accent); position: relative; display: inline-flex; align-items: center; justify-content: center; min-height: var(--control-height-md); padding: 0 var(--space-4); overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; user-select: none; touch-action: none; -webkit-tap-highlight-color: transparent; }
.mc-hold--danger { --mc-tone: var(--danger); } .mc-hold--neutral { --mc-tone: var(--text-secondary); }
.mc-hold__fill { position: absolute; inset: 0; background: color-mix(in oklab, var(--mc-tone) 15%, transparent); transform: scaleX(0); transform-origin: left; }
.mc-hold__label { position: relative; }
.mc-hold[data-done] { border-color: var(--mc-tone); color: var(--mc-tone); cursor: default; }
.mc-hold:disabled { opacity: .52; cursor: not-allowed; }
}
</style>
