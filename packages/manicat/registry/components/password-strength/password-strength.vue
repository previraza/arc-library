<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { animate, motionValue } from "motion";
import { computed, onMounted, reactive, ref, useAttrs, useId, watch } from "vue";
import PasswordStrengthNumber from "@/registry/components/password-strength/password-strength-number.vue";
import { createEyeMorph, animateSize, playPose, popOut } from "@/lib/motion-dom";
import { defaultPasswordRules, estimateStrength, moveRuleMark, moveSegments } from "@/lib/password-strength";
import type { PasswordRule } from "@/lib/password-strength";
import { motionTokens } from "@/lib/motion-tokens";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    /** Rules to check. Strength is the share of rules met, spread over four steps. */
    rules?: PasswordRule[];
    /** Error copy tied to the field. The field shakes once each time a new error appears. */
    error?: string;
    classNames?: {
      /** Slot for the password input */
      input?: string;
    };
  }>(),
  { rules: () => defaultPasswordRules },
);

/** `v-model` binds the password; `v-model:revealed` binds whether it is shown as text. */
const model = defineModel<string>({ default: "" });
const revealedModel = defineModel<boolean>("revealed", { default: undefined });
const attrs = useAttrs();
const generated = useId();
const controlId = computed(() => (attrs.id as string | undefined) ?? generated);
const rulesId = computed(() => `${controlId.value}-rules`);
const errorId = computed(() => `${controlId.value}-error`);
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const root = ref<HTMLElement>();
const shell = ref<HTMLElement>();
const eyeHost = ref<HTMLElement>();
let eye: ReturnType<typeof createEyeMorph> | undefined;
const revealedInternal = ref(false);
const revealed = computed(() => revealedModel.value ?? revealedInternal.value);
const revealChanged = ref(false);

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const strength = computed(() => estimateStrength(model.value, props.rules));
const met = computed(() => new Set(strength.value.met));

// The previous level and rule states tell which way the word moves and which segments and ticks join a staggered wave.
const rank = computed(() => (strength.value.label === "Too short" ? 0.5 : strength.value.level));
const metKey = computed(() => strength.value.met.join(" "));
const track = reactive({ rank: rank.value, level: strength.value.level, previousLevel: strength.value.level, direction: 1, metKey: metKey.value, previousMet: metKey.value });
watch([rank, metKey], () => {
  const next = { rank: rank.value, level: strength.value.level, previousLevel: track.rank !== rank.value ? track.level : track.previousLevel, direction: track.rank === rank.value ? track.direction : rank.value > track.rank ? 1 : -1, metKey: metKey.value, previousMet: track.metKey !== metKey.value ? track.metKey : track.previousMet };
  Object.assign(track, next);
}, { flush: "sync" });
const previousMet = computed(() => new Set(track.previousMet.split(" ").filter(Boolean)));
const changed = computed(() => props.rules.filter((rule) => met.value.has(rule.id) !== previousMet.value.has(rule.id)).map((rule) => rule.id));

let placed = false;
function sync() {
  const container = root.value;
  if (!container) return;
  moveSegments(container, { level: strength.value.level, previousLevel: track.previousLevel, reduced, instant: !placed });
  container.querySelectorAll<HTMLElement>("[data-rule]").forEach((mark) => {
    const id = mark.dataset.rule!;
    const order = changed.value.indexOf(id);
    moveRuleMark(mark, { met: met.value.has(id), delay: order > 0 ? order * 0.05 : 0, reduced, instant: !placed });
  });
  placed = true;
}

// A refused field shakes the way it does on a phone: a spring released with sideways velocity rings out on its own.
const shake = motionValue(0);
shake.on("change", (value) => shell.value && (shell.value.style.transform = `translateX(${value}px)`));
let lastError = props.error;
onMounted(() => {
  eye = createEyeMorph(eyeHost.value!, { slashed: revealed.value, reduced });
  sync();
});
watch([() => strength.value.level, metKey, () => props.rules], sync, { flush: "post" });
watch(revealed, (value) => eye?.set(value));
watch(() => props.error, (error) => {
  const previous = lastError;
  lastError = error;
  if (!error || error === previous || reduced) return;
  animate(shake as never, 0, { type: "spring", velocity: -240, stiffness: 900, damping: 15, restDelta: 0.1 } as never);
});

function toggleReveal() {
  revealedInternal.value = !revealed.value;
  revealedModel.value = !revealed.value;
  revealChanged.value = true;
}
function onInput(event: Event) {
  model.value = (event.target as HTMLInputElement).value;
}
const summary = computed(() => (strength.value.level ? `Strength: ${strength.value.label}. ${strength.value.met.length} of ${props.rules.length} requirements met.` : ""));
const describedBy = computed(() => [attrs["aria-describedby"] as string | undefined, props.error ? errorId.value : undefined, rulesId.value].filter(Boolean).join(" "));
const remainingOf = (rule: PasswordRule) => (model.value && !met.value.has(rule.id) ? (rule.remaining?.(model.value) ?? 0) : 0);

// The word rises when strength improves and drops when it falls, so the direction reads without looking at the meter.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterRise(el: Element, done: () => void) {
  if (reduced) return void playPose(el, { opacity: 0 }, { opacity: 1 }, { duration: duration.fast }).finished.then(done);
  const direction = el.closest("[data-error]") || el.hasAttribute("data-remaining") ? 1 : track.direction;
  playPose(el, { opacity: 0, y: em(el, 0.3 * direction), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveRise(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: duration.instant }).finished.then(done);
  const direction = el.closest("[data-error]") || el.hasAttribute("data-remaining") ? 1 : track.direction;
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3 * direction), blur: blur.subtle }, { duration: duration.fast, ease: "standard" }).finished.then(done);
}
// Error copy opens its row on a spring, then the words settle in. The row follows the measured copy, so a wrap never snaps.
function enterError(el: Element, done: () => void) {
  const node = el as HTMLElement;
  if (reduced) return done();
  node.style.height = "0px";
  playPose(node, { opacity: 0 }, { opacity: 1 }, { duration: duration.fast });
  animateSize(node, "height", "open", { spring: "smooth" }).finished.then(done);
}
function leaveError(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant });
  animateSize(el as HTMLElement, "height", "close", { spring: "smooth" }).finished.then(done);
}
</script>

<template>
  <div ref="root" class="mc-password-strength__field" :data-level="strength.level">
    <label class="mc-password-strength__label" :for="controlId">{{ label }}</label>
    <div ref="shell" class="mc-password-strength__shell">
      <input autocomplete="new-password" autocapitalize="off" autocorrect="off" :spellcheck="false" v-bind="{ ...attrs, class: undefined }" :id="controlId" :type="revealed ? 'text' : 'password'" :value="model" :aria-invalid="error ? true : (attrs['aria-invalid'] as boolean | undefined)" :aria-describedby="describedBy" :data-reveal="revealChanged ? (revealed ? 'shown' : 'hidden') : undefined" :class="cn('mc-password-strength__input', attrs.class as string | undefined, classNames?.input)" @input="onInput" />
      <button type="button" class="mc-password-strength__reveal" aria-label="Show password" :aria-pressed="revealed" :aria-controls="controlId" @click="toggleReveal"><span ref="eyeHost" style="display: contents" /></button>
    </div>
    <Transition :css="false" @enter="enterError" @leave="leaveError">
      <span v-if="error" key="error" data-error class="mc-password-strength__errorSlot"><span :id="errorId" class="mc-password-strength__error"><Transition :css="false" @enter="enterRise" @leave="leaveRise"><span :key="error" class="mc-password-strength__errorText">{{ error }}</span></Transition></span></span>
    </Transition>
    <div class="mc-password-strength__meterRow">
      <div class="mc-password-strength__meter" role="meter" aria-label="Password strength" :aria-valuemin="0" :aria-valuemax="4" :aria-valuenow="strength.level" :aria-valuetext="strength.level ? strength.label : 'No password yet'">
        <span v-for="index in 4" :key="index" class="mc-password-strength__segment"><span class="mc-password-strength__fill" :data-segment="index - 1" style="transform: translateX(-101%)" /></span>
      </div>
      <span class="mc-password-strength__word" aria-hidden="true"><Transition :css="false" @enter="enterRise" @leave="leaveRise"><span v-if="strength.level" :key="strength.label" class="mc-password-strength__wordText">{{ strength.label }}</span></Transition></span>
    </div>
    <ul :id="rulesId" class="mc-password-strength__rules" aria-label="Password requirements">
      <li v-for="rule in rules" :key="rule.id" class="mc-password-strength__rule" :data-met="met.has(rule.id) || undefined">
        <span class="mc-password-strength__mark" aria-hidden="true" :data-rule="rule.id">
          <span class="mc-password-strength__markFill" data-fill />
          <svg class="mc-password-strength__tick" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.75 8.25 7 10.5l4.25-4.75" /></svg>
        </span>
        <span class="mc-password-strength__ruleLabel">{{ rule.label }}<span class="mc-password-strength__srOnly">{{ met.has(rule.id) ? ", met" : ", not met" }}</span></span>
        <span class="mc-password-strength__remaining" aria-hidden="true"><Transition :css="false" @enter="enterRise" @leave="leaveRise"><span v-if="remainingOf(rule) > 0" key="remaining" data-remaining class="mc-password-strength__remainingText"><PasswordStrengthNumber :value="remainingOf(rule)" /> more</span></Transition></span>
      </li>
    </ul>
    <span class="mc-password-strength__srOnly" role="status">{{ summary }}</span>
  </div>
</template>

<style>
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
</style>
