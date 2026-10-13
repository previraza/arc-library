<script lang="ts">
  // @manicat-dependencies motion
  import { animate, motionValue } from "motion";
  import { onMount } from "svelte";
  import PasswordStrengthNumber from "@/registry/components/password-strength/password-strength-number.svelte";
  import { createEyeMorph, curveOf, poseTransition } from "@/lib/motion-dom";
  import { defaultPasswordRules, estimateStrength, moveRuleMark, moveSegments } from "@/lib/password-strength";
  import type { PasswordRule, PasswordStrengthResult } from "@/lib/password-strength";
  import { motionTokens } from "@/lib/motion-tokens";

  interface Props {
    label: string;
    /** The password. Bind it with `bind:value`. */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string, strength: PasswordStrengthResult) => void;
    /** Rules to check. Strength is the share of rules met, spread over four steps. */
    rules?: PasswordRule[];
    /** Error copy tied to the field. The field shakes once each time a new error appears. */
    error?: string;
    /** Whether the password is shown as text. Bind it with `bind:revealed`. */
    revealed?: boolean;
    onRevealedChange?: (revealed: boolean) => void;
    id?: string;
    class?: string;
    classNames?: {
      /** Slot for the password input */
      input?: string;
    };
    [key: string]: unknown;
  }

  let { label, value = $bindable(), defaultValue = "", onValueChange, rules = defaultPasswordRules, error, revealed = $bindable(), onRevealedChange, id, class: className, classNames, ...rest }: Props = $props();

  const generated = $props.id();
  const controlId = $derived(id ?? generated);
  const rulesId = $derived(`${controlId}-rules`);
  const errorId = $derived(`${controlId}-error`);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { duration, blur } = motionTokens;
  let root: HTMLElement;
  let shell: HTMLElement;
  let eyeHost: HTMLElement;
  let eye: ReturnType<typeof createEyeMorph> | undefined;
  let internal = $state(defaultValue);
  let revealedInternal = $state(false);
  let revealChanged = $state(false);
  const text = $derived(value ?? internal);
  const shown = $derived(revealed ?? revealedInternal);
  const strength = $derived(estimateStrength(text, rules));
  const met = $derived(new Set(strength.met));

  // The previous level and rule states tell which way the word moves and which segments and ticks join a staggered wave.
  const rank = $derived(strength.label === "Too short" ? 0.5 : strength.level);
  const metKey = $derived(strength.met.join(" "));
  let track = { rank: 0, level: 0, previousLevel: 0, direction: 1, metKey: "", previousMet: "" };
  let initialised = false;
  $effect.pre(() => {
    if (!initialised) {
      track = { rank, level: strength.level, previousLevel: strength.level, direction: 1, metKey, previousMet: metKey };
      initialised = true;
      return;
    }
    if (track.rank === rank && track.metKey === metKey) return;
    track = { rank, level: strength.level, previousLevel: track.rank !== rank ? track.level : track.previousLevel, direction: track.rank === rank ? track.direction : rank > track.rank ? 1 : -1, metKey, previousMet: track.metKey !== metKey ? track.metKey : track.previousMet };
  });
  const changed = $derived.by(() => {
    metKey;
    const previous = new Set(track.previousMet.split(" ").filter(Boolean));
    return rules.filter((rule) => met.has(rule.id) !== previous.has(rule.id)).map((rule) => rule.id);
  });

  let placed = false;
  $effect(() => {
    strength.level;
    metKey;
    rules;
    if (!root) return;
    moveSegments(root, { level: strength.level, previousLevel: track.previousLevel, reduced, instant: !placed });
    root.querySelectorAll<HTMLElement>("[data-rule]").forEach((mark) => {
      const ruleId = mark.dataset.rule!;
      const order = changed.indexOf(ruleId);
      moveRuleMark(mark, { met: met.has(ruleId), delay: order > 0 ? order * 0.05 : 0, reduced, instant: !placed });
    });
    placed = true;
  });

  // A refused field shakes the way it does on a phone: a spring released with sideways velocity rings out on its own.
  const shake = motionValue(0);
  shake.on("change", (offset) => shell && (shell.style.transform = `translateX(${offset}px)`));
  let lastError = error;
  $effect(() => {
    const next = error;
    const previous = lastError;
    lastError = next;
    if (!next || next === previous || reduced) return;
    animate(shake as never, 0, { type: "spring", velocity: -240, stiffness: 900, damping: 15, restDelta: 0.1 } as never);
  });
  onMount(() => {
    eye = createEyeMorph(eyeHost, { slashed: shown, reduced });
  });
  let firstEye = true;
  $effect(() => {
    const next = shown;
    if (firstEye) {
      firstEye = false;
      return;
    }
    eye?.set(next);
  });

  function toggleReveal() {
    const next = !shown;
    revealedInternal = next;
    revealed = next;
    onRevealedChange?.(next);
    revealChanged = true;
  }
  function oninput(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    internal = next;
    value = next;
    onValueChange?.(next, estimateStrength(next, rules));
  }
  const summary = $derived(strength.level ? `Strength: ${strength.label}. ${strength.met.length} of ${rules.length} requirements met.` : "");
  const describedBy = $derived([rest["aria-describedby"] as string | undefined, error ? errorId : undefined, rulesId].filter(Boolean).join(" "));
  const remainingOf = (rule: PasswordRule) => (text && !met.has(rule.id) ? (rule.remaining?.(text) ?? 0) : 0);

  // The word rises when strength improves and drops when it falls, so the direction reads without looking at the meter.
  const em = (node: Element, amount: number) => amount * parseFloat(getComputedStyle(node).fontSize);
  const riseIn = (node: HTMLElement, { direction = 0 }: { direction?: number } = {}) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, 0.3 * (direction || track.direction)), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.fast } : { duration: duration.standard, ease: "enter" })(node);
  const riseOut = (node: HTMLElement, { direction = 0 }: { direction?: number } = {}) => poseTransition(reduced ? { opacity: 0 } : { opacity: 0, y: em(node, -0.3 * (direction || track.direction)), blur: blur.subtle }, { opacity: 1, y: 0, blur: 0 }, reduced ? { duration: duration.instant } : { duration: duration.fast, ease: "standard" }, { pop: true })(node);
  // Error copy opens its row on a spring, then the words settle in.
  const errorIn = (node: HTMLElement) => {
    if (reduced) return { duration: 0 };
    const natural = node.offsetHeight;
    const { duration: length, easing } = curveOf({ spring: "smooth" });
    return { duration: length, easing, css: (t: number) => `height: ${natural * t}px; opacity: ${Math.min(1, t * 3)}; overflow: hidden;` };
  };
  const errorOut = (node: HTMLElement) => {
    if (reduced) return { duration: 0 };
    const natural = node.offsetHeight;
    const { duration: length, easing } = curveOf({ spring: "smooth" });
    return { duration: length, easing, css: (t: number) => `height: ${natural * t}px; opacity: ${Math.min(1, t * 6)}; overflow: hidden;` };
  };
</script>

<div bind:this={root} class={["mc-password-strength__field"]} data-level={strength.level}>
  <label class="mc-password-strength__label" for={controlId}>{label}</label>
  <div bind:this={shell} class="mc-password-strength__shell">
    <input autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck={false} {...rest} id={controlId} type={shown ? "text" : "password"} value={text} aria-invalid={error ? true : (rest["aria-invalid"] as boolean | undefined)} aria-describedby={describedBy} data-reveal={revealChanged ? (shown ? "shown" : "hidden") : undefined} class={["mc-password-strength__input", className, classNames?.input]} {oninput} />
    <button type="button" class="mc-password-strength__reveal" aria-label="Show password" aria-pressed={shown} aria-controls={controlId} onclick={toggleReveal}><span bind:this={eyeHost} style="display: contents"></span></button>
  </div>
  {#if error}
    <span class="mc-password-strength__errorSlot" in:errorIn out:errorOut><span id={errorId} class="mc-password-strength__error">{#key error}<span class="mc-password-strength__errorText" in:riseIn={{ direction: 1 }} out:riseOut={{ direction: 1 }}>{error}</span>{/key}</span></span>
  {/if}
  <div class="mc-password-strength__meterRow">
    <div class="mc-password-strength__meter" role="meter" aria-label="Password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={strength.level} aria-valuetext={strength.level ? strength.label : "No password yet"}>
      {#each [0, 1, 2, 3] as index (index)}<span class="mc-password-strength__segment"><span class="mc-password-strength__fill" data-segment={index} style="transform: translateX(-101%)"></span></span>{/each}
    </div>
    <span class="mc-password-strength__word" aria-hidden="true">{#if strength.level}{#key strength.label}<span class="mc-password-strength__wordText" in:riseIn out:riseOut>{strength.label}</span>{/key}{/if}</span>
  </div>
  <ul id={rulesId} class="mc-password-strength__rules" aria-label="Password requirements">
    {#each rules as rule (rule.id)}
      {@const remaining = remainingOf(rule)}
      <li class="mc-password-strength__rule" data-met={met.has(rule.id) || undefined}>
        <span class="mc-password-strength__mark" aria-hidden="true" data-rule={rule.id}>
          <span class="mc-password-strength__markFill" data-fill></span>
          <svg class="mc-password-strength__tick" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.75 8.25 7 10.5l4.25-4.75" /></svg>
        </span>
        <span class="mc-password-strength__ruleLabel">{rule.label}<span class="mc-password-strength__srOnly">{met.has(rule.id) ? ", met" : ", not met"}</span></span>
        <span class="mc-password-strength__remaining" aria-hidden="true">{#if remaining > 0}<span class="mc-password-strength__remainingText" in:riseIn={{ direction: 1 }} out:riseOut={{ direction: 1 }}><PasswordStrengthNumber value={remaining} /> more</span>{/if}</span>
      </li>
    {/each}
  </ul>
  <span class="mc-password-strength__srOnly" role="status">{summary}</span>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* No row gap: a closing error row would still pay it. Each row carries its own space instead. */
.mc-password-strength__field { --tone: var(--border-strong); display: grid; min-width: 0; }
.mc-password-strength__field[data-level="1"] { --tone: var(--danger); }
.mc-password-strength__field[data-level="2"] { --tone: var(--warning); }
.mc-password-strength__field[data-level="3"], .mc-password-strength__field[data-level="4"] { --tone: var(--success); }
.mc-password-strength__label { margin-bottom: var(--space-2); color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); }
/* The shell only transitions color; its sideways shake is a spring on transform, so the two never fight. */
.mc-password-strength__shell { display: flex; min-height: var(--control-height-md); align-items: center; gap: var(--space-1); padding: 0 5px 0 var(--space-4); border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-password-strength__shell:hover:not(:focus-within) { border-color: var(--text-muted); } }
.mc-password-strength__shell:focus-within { border-color: var(--foreground); }
.mc-password-strength__shell:has(.mc-password-strength__input[aria-invalid="true"]) { border-color: var(--danger); }
.mc-password-strength__input { width: 100%; min-width: 0; height: calc(var(--control-height-md) - 2px); padding: 0; border: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); letter-spacing: var(--tracking-body); outline: 0; }
.mc-password-strength__input::placeholder { color: var(--text-muted); }
/* Touch keyboards zoom into fields under 16px, so coarse pointers get the larger size. */
@media (pointer: coarse) { .mc-password-strength__input { font-size: var(--text-base); } }
/* Dots and characters resolve into each other instead of snapping. Swapping the keyframe name restarts it. */
.mc-password-strength__input[data-reveal="shown"] { animation: mc-password-strength-resolve-shown var(--duration-standard) var(--ease-enter); }
.mc-password-strength__input[data-reveal="hidden"] { animation: mc-password-strength-resolve-hidden var(--duration-standard) var(--ease-enter); }
@keyframes mc-password-strength-resolve-shown { from { opacity: .35; filter: blur(2px); } }
@keyframes mc-password-strength-resolve-hidden { from { opacity: .35; filter: blur(2px); } }
.mc-password-strength__reveal { display: grid; width: 34px; height: 34px; flex: 0 0 auto; place-items: center; padding: 0; border: 0; border-radius: calc(var(--radius-control) - 5px); background: transparent; color: var(--text-muted); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform var(--duration-spring) var(--ease-spring); }
@media (hover: hover) and (pointer: fine) { .mc-password-strength__reveal:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-password-strength__reveal:active { transform: scale(.94); transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), transform 100ms var(--ease-standard); }
.mc-password-strength__reveal[aria-pressed="true"] { color: var(--foreground); }
/* The row's space is padding inside the clipped slot, so its height opens from a true zero. */
.mc-password-strength__errorSlot { display: block; overflow: hidden; }
.mc-password-strength__error { position: relative; display: block; padding-top: var(--space-2); color: var(--danger); font-size: var(--text-xs); line-height: var(--leading-body); }
.mc-password-strength__errorText { display: block; }
.mc-password-strength__meterRow { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-3); }
.mc-password-strength__meter { display: grid; flex: 1 1 auto; min-width: 0; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
/* Each fill slides in from the left inside its clipped track, so the rounded ends keep their shape at every frame. */
.mc-password-strength__segment { position: relative; height: 4px; overflow: hidden; isolation: isolate; border-radius: var(--radius-pill); background: var(--border); }
.mc-password-strength__fill { position: absolute; inset: 0; border-radius: inherit; background: var(--tone); transition: background-color var(--duration-standard) var(--ease-standard); }
/* A fixed slot: the meter never resizes when the word changes, and the word stays flush with the field's edge. */
.mc-password-strength__word { position: relative; display: block; flex: 0 0 4.5rem; height: 1.4em; color: var(--foreground); font-size: var(--text-sm); font-weight: 500; line-height: var(--leading-body); text-align: right; white-space: nowrap; }
.mc-password-strength__wordText { display: inline-block; }
.mc-password-strength__rules { display: grid; gap: 6px; margin: var(--space-4) 0 0; padding: 0; list-style: none; }
.mc-password-strength__rule { display: flex; min-height: 1.25rem; align-items: center; gap: 10px; color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-body); transition: color var(--duration-standard) var(--ease-standard); }
.mc-password-strength__rule[data-met] { color: var(--foreground); }
.mc-password-strength__ruleLabel { min-width: 0; }
/* The outline hands over to a faint tint while the tick draws on top; most of the color sits on the tick. */
.mc-password-strength__mark { position: relative; display: block; width: 16px; height: 16px; flex: 0 0 16px; border: 1.25px solid var(--border-strong); border-radius: var(--radius-pill); color: var(--success); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-password-strength__rule[data-met] .mc-password-strength__mark { border-color: transparent; }
.mc-password-strength__markFill { position: absolute; inset: -1.25px; border-radius: inherit; background: color-mix(in oklab, var(--success) 16%, transparent); }
.mc-password-strength__tick { position: absolute; inset: -1.25px; width: 16px; height: 16px; }
.mc-password-strength__remaining { position: relative; display: block; margin-left: auto; padding-left: var(--space-2); color: var(--text-muted); font-size: var(--text-xs); white-space: nowrap; }
.mc-password-strength__remainingText { display: inline-flex; align-items: baseline; gap: .28em; }
.mc-password-strength__number { display: inline-flex; font-variant-numeric: tabular-nums; }
/* Places clip sideways only, so a narrowing column never shows half a digit and a turning digit is never cut. */
.mc-password-strength__place { position: relative; display: inline-block; overflow-x: clip; }
.mc-password-strength__digit { display: inline-block; }
.mc-password-strength__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .mc-password-strength__shell, .mc-password-strength__reveal, .mc-password-strength__fill, .mc-password-strength__rule, .mc-password-strength__mark { transition: none; }
  .mc-password-strength__reveal:active { transform: none; }
  .mc-password-strength__input[data-reveal] { animation: none; }
}
}
</style>
