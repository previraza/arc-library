<script setup lang="ts">
// @manicat-dependencies motion lucide-vue-next
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, watch } from "vue";
import { ChevronDown, FileCode2 } from "lucide-vue-next";
import CopyButton from "@/registry/components/copy-button/copy-button.vue";
import { createCodeHeight, createFileWidth, highlight, normaliseLanguage } from "@/lib/code-block";
import { playPose, popOut } from "@/lib/motion-dom";
import { motionTokens } from "@/lib/motion-tokens";
import { animate } from "motion";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Source shown in the block and copied by the action. */
    code: string;
    /** File name displayed in the header. */
    filename?: string;
    /** Used for the header label and lightweight syntax highlighting. */
    language?: string;
    /** Collapse longer sources to this many lines, with a toggle that expands the rest in place. */
    maxLines?: number;
    /** Extend the inner, named parts of the code block: block, header, file, language, viewport, pre, code, expand, swap, swapStack, srOnly or filename. */
    classNames?: { block?: string; header?: string; file?: string; language?: string; viewport?: string; pre?: string; code?: string; expand?: string; swap?: string; swapStack?: string; srOnly?: string; filename?: string };
  }>(),
  { language: "tsx" },
);

const attrs = useAttrs();
const preId = useId();
const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const { duration, blur } = motionTokens;
const expanded = ref(false);
const viewport = ref<HTMLElement>();
const pre = ref<HTMLElement>();
const nameBox = ref<HTMLElement>();
const sizer = ref<HTMLElement>();
const chevron = ref<HTMLElement>();
let heightControl: ReturnType<typeof createCodeHeight> | undefined;
let fileWidth: ReturnType<typeof createFileWidth> | undefined;

const cn = (base: string, ...extra: (string | undefined)[]) => [base, ...extra].filter(Boolean).join(" ");
const displayLanguage = computed(() => normaliseLanguage(props.language));
const name = computed(() => props.filename ?? "Source code");
const lineCount = computed(() => props.code.split("\n").length);
const collapsible = computed(() => props.maxLines != null && props.maxLines > 0 && lineCount.value > props.maxLines);
const open = computed(() => !collapsible.value || expanded.value);
const tokens = computed(() => highlight(props.code, displayLanguage.value));
const expandLabels = computed(() => [`Show all ${lineCount.value} lines`, "Show fewer lines"]);
const expandLabel = computed(() => expandLabels.value[expanded.value ? 1 : 0]);

onMounted(() => {
  heightControl = createCodeHeight(viewport.value!, pre.value!, { maxLines: props.maxLines, open: open.value, reduced });
  fileWidth = createFileWidth(nameBox.value!, sizer.value!, reduced);
});
onBeforeUnmount(() => {
  heightControl?.destroy();
  fileWidth?.destroy();
});
let lastName = name.value;
onUpdated(() => {
  heightControl?.setOpen(open.value);
  if (lastName !== name.value) {
    lastName = name.value;
    fileWidth?.update();
  }
});

watch(expanded, (next) => {
  if (chevron.value) animate(chevron.value, { rotate: next ? 180 : 0 } as never, (reduced ? { duration: 0 } : motionTokens.spring.snappy) as never);
});

// Text that changes in place: the new words rise in with a soft blur while the old ones leave upward, faster.
const em = (el: Element, amount: number) => amount * parseFloat(getComputedStyle(el).fontSize);
function enterText(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 0, y: em(el, 0.3), blur: blur.soft }, { opacity: 1, y: 0, blur: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveText(el: Element, done: () => void) {
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1, y: 0, blur: 0 }, { opacity: 0, y: em(el, -0.3), blur: blur.subtle }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}
function enterCode(el: Element, done: () => void) {
  if (reduced) return done();
  playPose(el, { opacity: 0, y: 4 }, { opacity: 1, y: 0 }, { duration: duration.standard, ease: "enter" }).finished.then(done);
}
function leaveCode(el: Element, done: () => void) {
  popOut(el as HTMLElement);
  if (reduced) return void animate(el, { opacity: 0 }, { duration: 0 }).finished.then(done);
  playPose(el, { opacity: 1 }, { opacity: 0 }, { duration: duration.instant, ease: "standard" }).finished.then(done);
}
</script>

<template>
  <section v-bind="{ ...attrs, class: undefined }" :class="cn('mc-code-block__block', attrs.class as string | undefined, classNames?.block)" :aria-label="filename ? `${filename} source code` : `${displayLanguage} source code`" :style="maxLines ? { '--code-lines': maxLines } : undefined">
    <header :class="cn('mc-code-block__header', classNames?.header)">
      <div :class="cn('mc-code-block__file', classNames?.file)">
        <FileCode2 :size="16" :stroke-width="1.75" aria-hidden="true" />
        <!-- A new file name swaps in while its box follows the new width on a spring, then returns to auto so it can still truncate. -->
        <span ref="nameBox" class="mc-code-block__swap mc-code-block__filename">
          <span ref="sizer" class="mc-code-block__sizer" aria-hidden="true">{{ name }}</span>
          <span class="mc-code-block__swapStack" aria-hidden="true"><Transition :css="false" @enter="enterText" @leave="leaveText"><span :key="name" class="mc-code-block__swapText">{{ name }}</span></Transition></span>
          <span class="mc-code-block__srOnly">{{ name }}</span>
        </span>
        <span :class="cn('mc-code-block__language', classNames?.language)">{{ displayLanguage }}</span>
      </div>
      <CopyButton :value="code" label="Copy code" />
    </header>
    <div ref="viewport" :class="cn('mc-code-block__viewport', classNames?.viewport)">
      <pre ref="pre" :id="preId" :class="cn('mc-code-block__pre', classNames?.pre)" tabindex="0" aria-label="Selectable source code"><Transition :css="false" @enter="enterCode" @leave="leaveCode"><code :key="code" :class="cn('mc-code-block__code', classNames?.code)"><template v-for="(token, index) in tokens" :key="index"><span v-if="token.kind" :class="`mc-code-block__${token.kind}`">{{ token.text }}</span><template v-else>{{ token.text }}</template></template></code></Transition></pre>
    </div>
    <button v-if="collapsible" type="button" :class="cn('mc-code-block__expand', classNames?.expand)" :aria-expanded="expanded" :aria-controls="preId" @click="expanded = !expanded">
      <!-- Both labels reserve the cell, so the chevron never moves when the words change. -->
      <span :class="cn('mc-code-block__swap', classNames?.swap)" aria-hidden="true"><span v-for="text in expandLabels" :key="text" class="mc-code-block__reserve">{{ text }}</span><span :class="cn('mc-code-block__swapStack', classNames?.swapStack)"><Transition :css="false" @enter="enterText" @leave="leaveText"><span :key="expandLabel" class="mc-code-block__swapText">{{ expandLabel }}</span></Transition></span></span>
      <span :class="cn('mc-code-block__srOnly', classNames?.srOnly)">{{ expandLabel }}</span>
      <span ref="chevron" class="mc-code-block__chevron" aria-hidden="true"><ChevronDown :size="16" :stroke-width="1.75" /></span>
    </button>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-code-block__block { width: 100%; min-width: 0; max-width: 100%; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
.mc-code-block__header { display: flex; min-height: 52px; align-items: center; justify-content: space-between; gap: var(--space-3); border-bottom: 1px solid var(--border-subtle); padding: var(--space-2) var(--space-3) var(--space-2) var(--space-4); background: var(--surface-raised); }
/* Baseline alignment keeps the smaller mono language label on the file name's baseline; the icon centres on its own. */
.mc-code-block__file { display: flex; min-width: 0; align-items: baseline; gap: var(--space-2); color: var(--text-secondary); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 500; letter-spacing: var(--tracking-body); line-height: var(--leading-body); }
.mc-code-block__file > svg { flex: none; align-self: center; color: var(--text-muted); }
.mc-code-block__filename { position: relative; min-width: 0; overflow: hidden; color: var(--foreground); }
/* Changing text stacks old and new words in one cell; reserve spans hold the widest label so the cell never snaps. */
.mc-code-block__swap { display: inline-grid; min-width: 0; white-space: nowrap; }
.mc-code-block__swap > span, .mc-code-block__swapStack > span { grid-area: 1 / 1; min-width: 0; }
.mc-code-block__swapStack { display: grid; min-width: 0; }
.mc-code-block__swapText { display: block; overflow: hidden; text-overflow: ellipsis; }
.mc-code-block__reserve { visibility: hidden; }
.mc-code-block__sizer { position: absolute; top: 0; left: 0; white-space: nowrap; visibility: hidden; pointer-events: none; }
.mc-code-block__srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.mc-code-block__language { flex: none; color: var(--text-muted); font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; font-size: var(--text-xs); font-weight: 400; }
.mc-code-block__language::before { content: "·"; margin-right: var(--space-2); color: var(--border-strong); }
/* The source area follows its content height on a spring. Before it measures, a collapsed block clips from CSS. */
.mc-code-block__viewport { --code-collapsed: calc(var(--code-lines, 0) * var(--text-sm) * 1.7 + var(--space-5) * 2); overflow: hidden; }
.mc-code-block__pre { position: relative; overflow: auto; margin: 0; padding: var(--space-5); color: var(--foreground); font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace; font-size: var(--text-sm); font-variant-ligatures: none; line-height: 1.7; tab-size: 2; white-space: pre; }
/* Block so new source can rise in with a transform; inline code ignores transforms. */
.mc-code-block__code { display: block; font-family: inherit; }
.mc-code-block__expand { display: flex; width: 100%; min-height: 44px; align-items: center; justify-content: center; gap: var(--space-2); border: 0; border-top: 1px solid var(--border-subtle); padding: 0 var(--space-4); background: var(--surface-raised); color: var(--text-secondary); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.mc-code-block__chevron { display: grid; flex: none; place-items: center; color: var(--text-muted); }
/* Each role has contrast in both themes; color supports, but never replaces, source text. */
.mc-code-block__comment { color: var(--text-muted); font-style: italic; }
.mc-code-block__string { color: oklch(46% .13 150); }
.mc-code-block__number { color: oklch(50% .14 55); }
.mc-code-block__keyword { color: oklch(48% .15 285); }
.mc-code-block__type { color: oklch(46% .13 230); }
.mc-code-block__function { color: oklch(43% .12 25); }
.mc-code-block__property { color: oklch(44% .12 85); }
.mc-code-block__tag { color: oklch(46% .13 230); }
.mc-code-block__punctuation { color: var(--text-secondary); }
:root[data-theme="dark"] .mc-code-block__string { color: oklch(77% .15 150); }
:root[data-theme="dark"] .mc-code-block__number { color: oklch(80% .14 75); }
:root[data-theme="dark"] .mc-code-block__keyword { color: oklch(78% .16 285); }
:root[data-theme="dark"] .mc-code-block__type { color: oklch(79% .13 230); }
:root[data-theme="dark"] .mc-code-block__function { color: oklch(80% .13 25); }
:root[data-theme="dark"] .mc-code-block__property { color: oklch(79% .12 85); }
:root[data-theme="dark"] .mc-code-block__tag { color: oklch(79% .13 230); }
@media (hover: hover) and (pointer: fine) { .mc-code-block__expand:hover { background: var(--surface-muted); color: var(--foreground); } .mc-code-block__expand:hover .mc-code-block__chevron { color: var(--foreground); } }
@media (max-width: 420px) { .mc-code-block__header { padding-left: var(--space-3); } .mc-code-block__header button { width: var(--control-height-sm); padding-inline: 0; } .mc-code-block__header button > span:last-of-type { display: none; } .mc-code-block__viewport { --code-collapsed: calc(var(--code-lines, 0) * var(--text-xs) * 1.7 + var(--space-4) * 2); } .mc-code-block__pre { padding: var(--space-4); font-size: var(--text-xs); } }
@media (prefers-reduced-motion: reduce) { .mc-code-block__expand { transition: none; } }
</style>
