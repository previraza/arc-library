<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from "vue";

export interface ExpandingSearchItem {
  id: string;
  title: string;
  meta?: string;
  group?: string;
  keywords?: string[];
}

const props = withDefaults(
  defineProps<{
    label: string;
    items: ExpandingSearchItem[];
    /** Shown under the field before anything is typed. */
    suggestions?: ExpandingSearchItem[];
    suggestionsLabel?: string;
    placeholder?: string;
    expandedWidth?: number;
    maxResults?: number;
    anchor?: "start" | "end";
    emptyHint?: string;
    /** Extend the inner, named parts of the search: trigger, field, input, results, result or empty. */
    classNames?: { trigger?: string; field?: string; input?: string; results?: string; result?: string; empty?: string };
  }>(),
  { suggestions: () => [], suggestionsLabel: "Recent", placeholder: "Search", expandedWidth: 360, maxResults: 6, anchor: "end", emptyHint: "Try a shorter word." },
);

const emit = defineEmits<{ select: [item: ExpandingSearchItem]; expandedChange: [expanded: boolean] }>();
const id = useId();
const root = ref<HTMLElement>();
const input = ref<HTMLInputElement>();
const expanded = ref(false);
const query = ref("");
const active = ref(0);

const results = computed(() => {
  const needle = query.value.trim().toLowerCase();
  if (!needle) return props.suggestions.slice(0, props.maxResults);
  return props.items.filter((item) => [item.title, item.meta ?? "", item.group ?? "", ...(item.keywords ?? [])].some((word) => word.toLowerCase().includes(needle))).slice(0, props.maxResults);
});

async function open() {
  expanded.value = true;
  emit("expandedChange", true);
  await nextTick();
  input.value?.focus();
}

function close() {
  expanded.value = false;
  query.value = "";
  active.value = 0;
  emit("expandedChange", false);
}

function choose(index: number) {
  const item = results.value[index];
  if (!item) return;
  emit("select", item);
  close();
}

function onKeydown(event: KeyboardEvent) {
  const count = results.value.length;
  if (event.key === "ArrowDown" && count) active.value = (active.value + 1) % count;
  else if (event.key === "ArrowUp" && count) active.value = (active.value - 1 + count) % count;
  else if (event.key === "Enter") choose(active.value);
  else if (event.key === "Escape") close();
  else return;
  event.preventDefault();
}

function onOutside(event: PointerEvent) {
  if (expanded.value && root.value && !root.value.contains(event.target as Node)) close();
}

onMounted(() => document.addEventListener("pointerdown", onOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside));
</script>

<template>
  <div ref="root" class="mc-xsearch" :data-anchor="anchor">
    <button v-if="!expanded" type="button" :class="['mc-xsearch__trigger', classNames?.trigger]" :aria-label="label" @click="open">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
    </button>
    <div v-else :class="['mc-xsearch__panel', classNames?.field]" :style="{ width: `min(${expandedWidth}px, calc(100vw - 2rem))` }">
      <div class="mc-xsearch__field">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
        <input ref="input" v-model="query" role="combobox" autocomplete="off" :placeholder="placeholder" :aria-label="label" aria-expanded="true" :aria-controls="`${id}-list`" :aria-activedescendant="results.length ? `${id}-option-${active}` : undefined" :class="['mc-xsearch__input', classNames?.input]" @keydown="onKeydown" />
        <button type="button" class="mc-xsearch__close" aria-label="Close search" @click="close">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </div>
      <div :id="`${id}-list`" role="listbox" :class="['mc-xsearch__results', classNames?.results]">
        <div v-if="!query.trim() && suggestions.length" class="mc-xsearch__group">{{ suggestionsLabel }}</div>
        <p v-if="query.trim() && results.length === 0" :class="['mc-xsearch__empty', classNames?.empty]">{{ emptyHint }}</p>
        <div v-for="(item, index) in results" :id="`${id}-option-${index}`" :key="item.id" role="option" :aria-selected="active === index" :class="['mc-xsearch__result', classNames?.result]" @pointermove="active = index" @click="choose(index)">
          <span>{{ item.title }}</span><span v-if="item.meta" class="mc-xsearch__meta">{{ item.meta }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-xsearch { position: relative; display: inline-block; }
.mc-xsearch__trigger { display: grid; place-items: center; width: var(--control-height-md); height: var(--control-height-md); border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--text-secondary); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-xsearch__trigger:hover { background: var(--surface-muted); color: var(--foreground); } }
.mc-xsearch__panel { animation: mc-xsearch-in .22s var(--ease-enter) both; }
.mc-xsearch[data-anchor="end"] .mc-xsearch__panel { margin-left: auto; transform-origin: right center; }
.mc-xsearch__field { display: flex; align-items: center; gap: var(--space-2); min-height: var(--control-height-md); padding: 0 var(--space-3); border: 1px solid var(--foreground); border-radius: var(--radius-pill); background: var(--surface); color: var(--text-muted); }
.mc-xsearch__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-xsearch__close { display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 50%; background: transparent; color: var(--text-muted); cursor: pointer; }
.mc-xsearch__results { margin-top: var(--space-2); padding: 6px; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); }
.mc-xsearch__group { padding: 6px var(--space-3) 2px; color: var(--text-muted); font-size: var(--text-xs); }
.mc-xsearch__result { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-xsearch__result[aria-selected="true"] { background: var(--surface-muted); }
.mc-xsearch__meta { color: var(--text-muted); font-size: var(--text-xs); }
.mc-xsearch__empty { margin: 0; padding: var(--space-3); color: var(--text-muted); font-size: var(--text-sm); }
@keyframes mc-xsearch-in { from { opacity: 0; transform: scaleX(.6); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-xsearch__panel { animation: none; } }
</style>
