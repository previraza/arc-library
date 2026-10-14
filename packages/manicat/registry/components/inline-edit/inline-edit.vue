<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from "vue";
import { Check, CircleAlert, Pencil, X } from "lucide-vue-next";
import InlineEditReveal from "@/registry/components/inline-edit/inline-edit-reveal.vue";
import { playPose, popOut } from "@/lib/motion-dom";
import { createInlineSizing, drawTick, slotPoses, textPoses } from "@/lib/inline-edit";
import type { CaretDocument } from "@/lib/inline-edit";

type Phase = "idle" | "saving" | "saved" | "failed";

defineOptions({ inheritAttrs: false });

/**
 * Click-to-edit text for names and short fields that are read far more often than they change, such as a project name or its description.
 * The text turns into a field in place with the same metrics, so nothing around it moves, and the box grows with what you type. Enter saves
 * optimistically and a check draws once the save lands; Escape rolls the text back. A failed save restores the last saved value and says why.
 * Use a regular form when several fields must be saved together.
 */
const props = withDefaults(
  defineProps<{
    /** The saved value, bound with `v-model`. A new value from outside replaces the text while it is not being edited. */
    modelValue: string;
    /** Persists the new value before `v-model` updates. Return a promise to show the saving state, and reject it to roll back. */
    save?: (next: string) => void | Promise<unknown>;
    /** Accessible name, for example “Project name”. */
    label: string;
    /** Returns a message when the draft cannot be saved. */
    validate?: (next: string) => string | null | undefined;
    /** Shown when the value is empty. */
    placeholder?: string;
    /** Wraps onto several lines and grows in height. Enter still saves; Shift+Enter adds a line break. */
    multiline?: boolean;
    /** `title` for names and headings, `body` for descriptions. */
    variant?: "title" | "body";
    /** The element that holds the text, so a title can stay a heading. */
    as?: "span" | "p" | "h1" | "h2" | "h3";
    /** Extend the inner, named parts of the inline-edit: field, line, box, display, layer, text, slot, slotItem, actions, save, cancel, spinner, saved, failedIcon, pencil, frame or hint. */
    classNames?: Record<string, string | undefined>;
  }>(),
  { placeholder: "", multiline: false, variant: "title", as: "span" },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const attrs = useAttrs();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const cn = (base: string, key: string) => (props.classNames?.[key] ? `${base} ${props.classNames[key]}` : base);
const ids = useId();
const displayHintId = `${ids}-display`;
const editHintId = `${ids}-edit`;
const messageId = `${ids}-message`;

const committed = ref(props.modelValue);
const shown = ref(props.modelValue);
const seen = ref(props.modelValue);
const layer = ref({ key: 0, direction: 1 });
const editing = ref(false);
const draft = ref(props.modelValue);
const phase = ref<Phase>("idle");
const error = ref<string | null>(null);
const failed = ref<string | null>(null);
const flash = ref<"on" | "off" | null>(null);
const announcement = ref("");
const root = ref<HTMLElement>();
const display = ref<HTMLElement>();
const box = ref<HTMLElement>();
const frame = ref<HTMLElement>();
let control = null as HTMLInputElement | HTMLTextAreaElement | null;
let selection: number | "all" | null = null;
let focusDisplay = false;
let saveRun = 0;
let timers: ReturnType<typeof setTimeout>[] = [];
let sizing: ReturnType<typeof createInlineSizing> | undefined;

// A new value from outside replaces the text, unless the person is typing or a save is still in flight.
watch(() => props.modelValue, (value) => {
  if (value === seen.value) return;
  seen.value = value;
  if (value !== committed.value) {
    committed.value = value;
    if (!editing.value && phase.value !== "saving" && value !== shown.value) {
      shown.value = value;
      layer.value = { key: layer.value.key + 1, direction: 1 };
    }
  }
}, { flush: "sync" });

const layerText = () => (editing.value ? draft.value : shown.value);
const saving = () => phase.value === "saving";
const later = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)); };

onMounted(() => {
  sizing = createInlineSizing({ display: display.value!, box: box.value!, frame: frame.value!, control: () => control }, { multiline: () => props.multiline, editing: () => editing.value, reduced });
  sizing.change();
});
onBeforeUnmount(() => { timers.forEach(clearTimeout); sizing?.destroy(); });
watch([layerText, editing, () => props.multiline], () => sizing?.change(), { flush: "post" });

// Focus follows the mode: into the field with the caret where the text was clicked, and back to the text after Enter or Escape.
onUpdated(() => {
  const field = control;
  if (editing.value && field && selection !== null) {
    const at = selection;
    selection = null;
    field.focus({ preventScroll: true });
    if (at === "all") field.select();
    else field.setSelectionRange(at, at);
  }
  if (!editing.value && focusDisplay) {
    focusDisplay = false;
    display.value?.focus({ preventScroll: true });
  }
});

function startEdit(at: number | "all", text = shown.value) {
  if (editing.value || saving()) return;
  draft.value = text;
  editing.value = true;
  error.value = null;
  failed.value = null;
  flash.value = null;
  if (phase.value !== "idle") phase.value = "idle";
  selection = at;
}

/** The caret lands on the character that was clicked, the way it would in a text field. */
function caretAt(x: number, y: number) {
  const node = display.value?.querySelector(`[data-layer="${layer.value.key}"]`)?.firstChild;
  if (!node || !shown.value) return shown.value.length;
  const doc = document as CaretDocument;
  const position = doc.caretPositionFromPoint?.(x, y);
  if (position) return position.offsetNode === node ? Math.min(position.offset, shown.value.length) : shown.value.length;
  const range = doc.caretRangeFromPoint?.(x, y);
  return range && range.startContainer === node ? Math.min(range.startOffset, shown.value.length) : shown.value.length;
}

function onDisplayClick(event: MouseEvent) {
  if (saving()) return;
  // A keyboard activation selects everything, ready to retype; a click puts the caret where it landed.
  startEdit(event.detail === 0 ? "all" : caretAt(event.clientX, event.clientY));
}

const clean = (text: string) => (props.multiline ? text.trim() : text.replace(/\s+/g, " ").trim());

function submit(source: "key" | "button" | "blur") {
  const next = clean(draft.value);
  const problem = props.validate?.(next) || null;
  if (problem) {
    error.value = problem;
    if (source !== "blur") control?.focus();
    return;
  }
  editing.value = false;
  error.value = null;
  if (source !== "blur") focusDisplay = true;
  // Trimmed spaces would shift the text in one frame, so a cleaned value arrives with the text motion instead.
  if (next !== draft.value) layer.value = { key: layer.value.key + 1, direction: 1 };
  if (next === shown.value) return;
  const previous = committed.value;
  const run = ++saveRun;
  shown.value = next;
  phase.value = "saving";
  announcement.value = `Saving ${props.label.toLowerCase()}`;
  Promise.resolve().then(() => props.save?.(next)).then(() => {
    if (run !== saveRun) return;
    committed.value = next;
    seen.value = next;
    emit("update:modelValue", next);
    phase.value = "saved";
    announcement.value = `${props.label} saved`;
    later(() => { if (phase.value === "saved") phase.value = "idle"; }, 1800);
  }, () => {
    if (run !== saveRun) return;
    shown.value = previous;
    layer.value = { key: layer.value.key + 1, direction: -1 };
    phase.value = "failed";
    failed.value = next;
    flash.value = "on";
    announcement.value = "";
    later(() => { if (flash.value === "on") flash.value = "off"; }, 1400);
    later(() => { if (flash.value === "off") flash.value = null; }, 2000);
  });
}

function cancel() {
  editing.value = false;
  error.value = null;
  focusDisplay = true;
  if (draft.value !== shown.value) layer.value = { key: layer.value.key + 1, direction: -1 };
}

function retry() {
  if (!failed.value) return;
  startEdit(failed.value.length, failed.value);
}

function onInput(event: Event) {
  const next = (event.target as HTMLInputElement).value;
  draft.value = next;
  if (error.value) error.value = props.validate?.(clean(next)) || null;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    cancel();
    return;
  }
  if (event.key === "Enter" && !event.isComposing && !(props.multiline && event.shiftKey)) {
    event.preventDefault();
    submit("key");
  }
}

// Leaving the component saves, the way a rename does; switching windows does not.
function onBlur(event: FocusEvent) {
  if (!editing.value) return;
  const next = event.relatedTarget as Node | null;
  if (next && root.value?.contains(next)) return;
  if (!next && !document.hasFocus()) return;
  submit("blur");
}

const noun = () => props.label.toLowerCase();
const message = () => (error.value ? { key: `error:${error.value}`, tone: "error" as const, text: error.value } : failed.value && !editing.value ? { key: `failed:${failed.value}`, tone: "failed" as const, text: `Couldn’t save “${failed.value}”, so the last saved ${noun()} is back.` } : null);
const slot = () => (editing.value ? "edit" : phase.value);
const describedBy = (hint: string) => [hint, message() ? messageId : null].filter(Boolean).join(" ");

// The text rises in from a soft blur; the slot icon scales in on a spring.
const enterText = (el: Element, done: () => void) => { const poses = textPoses(el as HTMLElement, layer.value.direction, reduced); void playPose(el, poses.from, poses.rest, poses.enterTiming).finished.then(done); };
const leaveText = (el: Element, done: () => void) => { const poses = textPoses(el as HTMLElement, layer.value.direction, reduced); popOut(el as HTMLElement); void playPose(el, poses.rest, poses.out, poses.leaveTiming).finished.then(done); };
const enterSlot = (el: Element, done: () => void) => { const poses = slotPoses(reduced); const path = el.querySelector("path"); if (path) drawTick(path, reduced); void playPose(el, poses.from, poses.rest, poses.enterTiming).finished.then(done); };
const leaveSlot = (el: Element, done: () => void) => { const poses = slotPoses(reduced); void playPose(el, poses.rest, poses.from, poses.leaveTiming).finished.then(done); };
void nextTick;
const setControl = (el: unknown) => { control = el as HTMLInputElement | HTMLTextAreaElement | null; };
</script>

<template>
  <div ref="root" v-bind="{ ...attrs, class: undefined }" :class="['mc-inline-edit__root', attrs.class as string | undefined]" :data-variant="variant" :data-multiline="multiline || undefined" :data-editing="editing || undefined" :data-phase="phase" :data-invalid="error ? '' : undefined" :data-flash="flash ?? undefined" @focusout="onBlur">
    <component :is="as" :class="cn('mc-inline-edit__line', 'line')">
      <span ref="box" :class="cn('mc-inline-edit__box', 'box')">
        <!-- The text stays in flow while editing, hidden and mirroring the draft, so it sizes the box and can roll back with motion on Escape. -->
        <button ref="display" type="button" :class="cn('mc-inline-edit__display', 'display')" :tabindex="editing ? -1 : undefined" :aria-label="`${label}: ${shown || placeholder}`" :aria-describedby="describedBy(displayHintId)" :aria-disabled="saving() || undefined" @click="onDisplayClick">
          <span :class="cn('mc-inline-edit__layer', 'layer')" :data-empty="layerText() ? undefined : ''">
            <Transition :css="false" @enter="enterText" @leave="leaveText">
              <span :key="layer.key" :data-layer="layer.key" :class="cn('mc-inline-edit__text', 'text')">{{ (layerText() || placeholder || "\u200b") + (multiline && editing ? "\u200b" : "") }}</span>
            </Transition>
          </span>
        </button>
        <textarea v-if="editing && multiline" :ref="setControl" class="mc-inline-edit__control" :value="draft" :placeholder="placeholder" :aria-label="label" :aria-invalid="error ? true : undefined" :aria-describedby="describedBy(editHintId)" autocomplete="off" :spellcheck="variant === 'body'" rows="1" enterkeyhint="done" @input="onInput" @keydown="onKeydown" />
        <input v-else-if="editing" :ref="setControl" class="mc-inline-edit__control" type="text" :value="draft" :placeholder="placeholder" :aria-label="label" :aria-invalid="error ? true : undefined" :aria-describedby="describedBy(editHintId)" autocomplete="off" :spellcheck="variant === 'body'" enterkeyhint="done" @input="onInput" @keydown="onKeydown" />
        <span ref="frame" :class="cn('mc-inline-edit__frame', 'frame')">
          <span :class="cn('mc-inline-edit__slot', 'slot')">
            <Transition :css="false" @enter="enterSlot" @leave="leaveSlot">
              <span :key="slot()" :class="cn('mc-inline-edit__slotItem', 'slotItem')">
                <span v-if="slot() === 'edit'" :class="cn('mc-inline-edit__actions', 'actions')">
                  <button type="button" :class="cn('mc-inline-edit__save', 'save')" :aria-label="`Save ${noun()}`" @pointerdown.prevent @click="submit('button')"><Check :size="15" :stroke-width="2" aria-hidden="true" /></button>
                  <button type="button" :class="cn('mc-inline-edit__cancel', 'cancel')" aria-label="Cancel editing" @pointerdown.prevent @click="cancel"><X :size="15" :stroke-width="2" aria-hidden="true" /></button>
                </span>
                <span v-else-if="slot() === 'saving'" :class="cn('mc-inline-edit__spinner', 'spinner')" aria-hidden="true" />
                <span v-else-if="slot() === 'saved'" :class="cn('mc-inline-edit__saved', 'saved')" aria-hidden="true"><svg :width="16" :height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" /></svg></span>
                <CircleAlert v-else-if="slot() === 'failed'" :class="cn('mc-inline-edit__failedIcon', 'failedIcon')" :size="16" :stroke-width="1.75" aria-hidden="true" />
                <Pencil v-else :class="cn('mc-inline-edit__pencil', 'pencil')" :size="14" :stroke-width="1.75" aria-hidden="true" @click="startEdit(shown.length)" />
              </span>
            </Transition>
          </span>
        </span>
      </span>
    </component>
    <InlineEditReveal :id="messageId" :message="message()" :reduced="reduced" @retry="retry" />
    <span :id="displayHintId" class="mc-inline-edit__srOnly">Activate to edit.</span>
    <span :id="editHintId" class="mc-inline-edit__srOnly">{{ multiline ? "Enter saves, Shift+Enter adds a line break, Escape cancels." : "Enter saves, Escape cancels." }}</span>
    <span class="mc-inline-edit__srOnly" role="status">{{ announcement }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
/* The box sits a border and padding outside the text, so the text lines up with the content around it and the hover surface reaches past it. */
.mc-inline-edit__root { --pad-x: 8px; --pad-y: 3px; position: relative; display: grid; min-width: 0; margin-inline-start: calc(-1 * (var(--pad-x) + 1px)); font-family: var(--font-body); letter-spacing: var(--tracking-body); }
/* Whole-pixel line heights: an input centres its text by rounding, so a fractional line would sit the field a pixel below the display. */
.mc-inline-edit__root[data-variant="title"] { --size: var(--text-xl); --leading: round(var(--size) * 1.3, 2px); --weight: 500; --ink: var(--foreground); }
.mc-inline-edit__root[data-variant="body"] { --pad-y: 5px; --size: var(--text-sm); --leading: round(var(--size) * 1.5, 1px); --weight: 400; --ink: var(--text-secondary); }
/* Room for the actions is reserved in every state, so the text never rewraps when editing starts. */
/* Inter at every size here: a heading host keeps its semantics but not the display face. */
.mc-inline-edit__line { display: block; min-width: 0; margin: 0; padding-inline-end: 66px; color: var(--ink); font-family: var(--font-body); font-size: var(--size); font-weight: var(--weight); line-height: var(--leading); letter-spacing: var(--tracking-body); }
.mc-inline-edit__root[data-multiline] .mc-inline-edit__line { padding-inline-end: 38px; }
.mc-inline-edit__box { position: relative; display: inline-block; max-width: 100%; vertical-align: top; }
.mc-inline-edit__root[data-multiline] .mc-inline-edit__box { display: block; }

/* Display and field share every metric: border, padding, font, and line height. Only the frame behind them changes. */
.mc-inline-edit__display, .mc-inline-edit__control { box-sizing: border-box; margin: 0; padding: var(--pad-y) var(--pad-x); border: 1px solid transparent; border-radius: var(--radius-control); background: transparent; color: inherit; font: inherit; font-feature-settings: inherit; letter-spacing: inherit; word-spacing: inherit; line-height: var(--leading); text-align: left; text-indent: 0; text-transform: none; -webkit-tap-highlight-color: transparent; }
.mc-inline-edit__display { position: relative; z-index: 1; display: block; max-width: 100%; cursor: text; }
.mc-inline-edit__root[data-multiline] .mc-inline-edit__display { width: 100%; }
.mc-inline-edit__root[data-editing] .mc-inline-edit__display { visibility: hidden; }
/* While editing, a single line keeps a little extra room, so the next character never has to wait for the box. */
.mc-inline-edit__root[data-editing]:not([data-multiline]) .mc-inline-edit__display { min-width: 5em; padding-inline-end: calc(var(--pad-x) + 16px); }
.mc-inline-edit__display[aria-disabled="true"] { cursor: progress; }
.mc-inline-edit__display:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-inline-edit__layer { position: relative; display: block; transition: opacity var(--duration-standard) var(--ease-standard); }
.mc-inline-edit__layer[data-empty] { color: var(--text-muted); }
/* An optimistic save shows the new text at once, a little quieter until the save lands; then it settles to full strength. */
.mc-inline-edit__root[data-phase="saving"] .mc-inline-edit__layer { opacity: .5; transition-duration: var(--duration-fast); }
.mc-inline-edit__text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: pre; }
.mc-inline-edit__root[data-multiline] .mc-inline-edit__text { overflow: visible; white-space: pre-wrap; overflow-wrap: break-word; }
.mc-inline-edit__control { position: absolute; top: 0; left: 0; z-index: 2; width: 100%; height: 100%; outline: none; resize: none; overflow: hidden; caret-color: var(--foreground); }
/* The frame carries the focus ring for the field, so the field itself never draws a second one. */
.mc-inline-edit__control:focus-visible { outline: none; }
.mc-inline-edit__control::placeholder { color: var(--text-muted); opacity: 1; }
textarea.mc-inline-edit__control { white-space: pre-wrap; overflow-wrap: break-word; }

/* The frame is the only surface: a hover tint at rest, a bordered field while editing, a soft danger wash when a save fails. */
.mc-inline-edit__frame { position: absolute; top: 0; bottom: 0; left: 0; z-index: 0; box-sizing: border-box; border: 1px solid transparent; border-radius: var(--radius-control); background: transparent; pointer-events: none; transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-standard) var(--ease-standard); }
.mc-inline-edit__root[data-multiline] .mc-inline-edit__frame { right: 0; }
@media (hover: hover) and (pointer: fine) {
  .mc-inline-edit__display:not([aria-disabled="true"]):hover ~ .mc-inline-edit__frame { background: var(--surface-muted); }
  .mc-inline-edit__pencil { opacity: 0; transition: opacity var(--duration-fast) var(--ease-standard); }
  .mc-inline-edit__display:hover ~ .mc-inline-edit__frame .mc-inline-edit__pencil, .mc-inline-edit__display:focus-visible ~ .mc-inline-edit__frame .mc-inline-edit__pencil, .mc-inline-edit__pencil:hover { opacity: 1; }
}
.mc-inline-edit__root[data-editing] .mc-inline-edit__frame { border-color: var(--foreground); background: var(--surface); box-shadow: 0 0 0 3px var(--focus-ring); }
.mc-inline-edit__root[data-invalid] .mc-inline-edit__frame { border-color: var(--danger); box-shadow: 0 0 0 3px color-mix(in oklab, var(--danger) 24%, transparent); }
.mc-inline-edit__root[data-flash="on"] .mc-inline-edit__frame { border-color: color-mix(in oklab, var(--danger) 30%, transparent); background: color-mix(in oklab, var(--danger) 9%, transparent); }
/* The wash leaves slowly, without any movement, once the message has been read. */
.mc-inline-edit__root[data-flash="off"] .mc-inline-edit__frame { transition-duration: var(--duration-considered); }

/* The slot rides on the frame's edge, so it follows the width morph instead of jumping to the new width. */
.mc-inline-edit__slot { position: absolute; top: 50%; left: calc(100% + 6px); display: grid; min-height: 28px; margin-top: -14px; pointer-events: auto; }
.mc-inline-edit__root[data-multiline] .mc-inline-edit__slot { top: 0; left: calc(100% + 8px); margin-top: calc(var(--pad-y) + var(--leading) / 2 - 13px); }
.mc-inline-edit__slotItem { display: grid; grid-area: 1 / 1; min-height: 28px; place-items: center start; }
.mc-inline-edit__actions { display: flex; gap: 4px; }
.mc-inline-edit__root[data-multiline] .mc-inline-edit__actions { flex-direction: column; }
.mc-inline-edit__save, .mc-inline-edit__cancel { display: grid; width: 28px; height: 28px; flex: none; place-items: center; padding: 0; border: 1px solid transparent; border-radius: var(--radius-pill); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard); }
.mc-inline-edit__save { background: var(--foreground); color: var(--background); }
.mc-inline-edit__cancel { border-color: var(--border); background: var(--surface); color: var(--text-secondary); }
.mc-inline-edit__save:active, .mc-inline-edit__cancel:active { transform: scale(.96); }
@media (hover: hover) and (pointer: fine) { .mc-inline-edit__save:hover { background: color-mix(in oklab, var(--foreground) 86%, var(--background)); } .mc-inline-edit__cancel:hover { border-color: var(--border-strong); background: var(--surface-muted); color: var(--foreground); } }
.mc-inline-edit__save:focus-visible, .mc-inline-edit__cancel:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-inline-edit__pencil { margin-left: 2px; color: var(--text-muted); cursor: pointer; }
.mc-inline-edit__spinner { display: block; width: 14px; height: 14px; margin-left: 2px; border: 1.5px solid var(--text-muted); border-right-color: transparent; border-radius: var(--radius-pill); animation: mc-inline-edit-spin .7s linear infinite; }
.mc-inline-edit__saved { display: grid; margin-left: 1px; place-items: center; color: var(--success); }
.mc-inline-edit__failedIcon { margin-left: 1px; color: var(--danger); }

/* The message row opens from a true zero; its spacing lives inside the clipped slot. */
.mc-inline-edit__reveal { display: block; overflow: hidden; }
.mc-inline-edit__revealInner { position: relative; display: block; }
.mc-inline-edit__message { display: flex; align-items: flex-start; gap: 6px; padding: 6px var(--pad-x) 4px calc(var(--pad-x) + 1px); color: var(--text-secondary); font-size: var(--text-xs); font-weight: 400; line-height: var(--leading-body); }
.mc-inline-edit__message[data-tone="error"] { color: var(--danger); }
.mc-inline-edit__messageIcon { flex: none; margin-top: 2px; color: var(--danger); }
.mc-inline-edit__retry { margin: 0 0 0 2px; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--foreground); font: inherit; font-weight: 500; text-decoration: underline; text-decoration-color: var(--border-strong); text-underline-offset: 3px; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-inline-edit__retry:hover { text-decoration-color: currentColor; } }
.mc-inline-edit__retry:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.mc-inline-edit__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes mc-inline-edit-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .mc-inline-edit__spinner { animation: none; border-right-color: var(--text-muted); border-top-color: transparent; } .mc-inline-edit__layer, .mc-inline-edit__save, .mc-inline-edit__cancel, .mc-inline-edit__pencil { transition: none; } }
</style>
