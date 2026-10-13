<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import Button from "@/registry/components/button/button.vue";
import SegmentedControl from "@/registry/components/segmented-control/segmented-control.vue";

export type EmptyScene = "search" | "offline" | "inbox" | "map";
type Phase = "idle" | "loading" | "done";

const COPY = {
  search: {
    idle: { title: "No results for “Q3 roadmap”", line: "Two filters are on: owner is Emma Collins and status is archived.", action: "Clear filters" },
    done: { title: "12 results for “Q3 roadmap”", line: "Filters cleared. Showing matches from every owner and status.", action: "Restore filters" },
    loading: "", wait: 0, glyph: "⌕",
  },
  offline: {
    idle: { title: "You are offline", line: "Edits are saved on this device and sync when the connection returns.", action: "Try again" },
    done: { title: "Back online", line: "Three edits synced to the Northwind workspace just now.", action: "Go offline" },
    loading: "Reaching sync.northwind.example…", wait: 1400, glyph: "⌁",
  },
  inbox: {
    idle: { title: "All caught up", line: "You have read every message in Inbox. New mail lands here first.", action: "Check for mail" },
    done: { title: "Still all caught up", line: "Checked just now. Nothing new since 8:30 this morning.", action: "Check again" },
    loading: "Checking for new mail…", wait: 1100, glyph: "✓",
  },
  map: {
    idle: { title: "Page not found", line: "The link to /projects/atlas-2023 is broken, or the page has moved.", action: "Find the page" },
    done: { title: "Found it in Archive", line: "Atlas 2023 roadmap moved to /archive/atlas-2023 in March.", action: "Show broken link" },
    loading: "Searching the workspace for Atlas…", wait: 1200, glyph: "?",
  },
};
const SCENES = [
  { value: "search", label: "No results" },
  { value: "offline", label: "Offline" },
  { value: "inbox", label: "Caught up" },
  { value: "map", label: "Not found" },
];

const props = withDefaults(
  defineProps<{
    /** Scene shown first. */
    defaultScene?: EmptyScene;
    /** Extend the inner, named parts of the block: art, glyph, title or line. */
    classNames?: { art?: string; glyph?: string; title?: string; line?: string };
  }>(),
  { defaultScene: "search" },
);
/** Fires when a scene's primary action finishes. */
const emit = defineEmits<{ action: [scene: EmptyScene, phase: Phase] }>();

const scene = ref<EmptyScene>(props.defaultScene);
const phase = ref<Phase>("idle");
const entry = computed(() => COPY[scene.value]);
const copy = computed(() => (phase.value === "done" ? entry.value.done : entry.value.idle));
let timer: ReturnType<typeof setTimeout> | undefined;

function settle() {
  phase.value = "done";
  emit("action", scene.value, "done");
}
function act() {
  if (phase.value === "loading") return;
  if (phase.value === "done") return void (phase.value = "idle");
  if (entry.value.wait === 0) return settle();
  phase.value = "loading";
  timer = setTimeout(settle, entry.value.wait);
}
function pick(next: string | undefined) {
  clearTimeout(timer);
  scene.value = (next ?? "search") as EmptyScene;
  phase.value = "idle";
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <section class="mc-empty" aria-label="Empty states">
    <SegmentedControl :model-value="scene" label="Empty state" :options="SCENES" @update:model-value="pick" />
    <div :class="['mc-empty__art', classNames?.art]">
      <span :class="['mc-empty__glyph', { 'mc-empty__glyph--done': phase === 'done' }, classNames?.glyph]" aria-hidden="true">{{ entry.glyph }}</span>
    </div>
    <h2 :class="['mc-empty__title', classNames?.title]">{{ copy.title }}</h2>
    <p :class="['mc-empty__line', classNames?.line]" aria-live="polite">{{ phase === "loading" ? entry.loading : copy.line }}</p>
    <Button size="sm" :loading="phase === 'loading'" @click="act">{{ copy.action }}</Button>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-empty { display: grid; justify-items: center; gap: 14px; max-width: 440px; color: var(--foreground); text-align: center; }
.mc-empty__art { display: grid; place-items: center; align-self: stretch; height: 180px; border: 1px solid var(--border); border-radius: 28px; background: var(--surface-muted); }
.mc-empty__glyph { color: var(--text-muted); font-size: 64px; line-height: 1; transition: color var(--duration-standard) var(--ease-standard), transform var(--duration-standard) var(--ease-standard); }
.mc-empty__glyph--done { color: var(--success); transform: scale(1.08); }
.mc-empty__title { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -.03em; }
.mc-empty__line { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
</style>
