<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from "vue";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string[];
  shortcut?: string;
}

const props = withDefaults(
  defineProps<{
    items: CommandItem[];
    placeholder?: string;
    label?: string;
    autoFocus?: boolean;
    /** Extend the inner, named parts of the palette: input, list, group, item or empty. */
    classNames?: { input?: string; list?: string; group?: string; item?: string; empty?: string };
  }>(),
  { placeholder: "Search commands", label: "Command palette", autoFocus: false },
);

const emit = defineEmits<{ select: [item: CommandItem]; close: [] }>();
const id = useId();
const query = ref("");
const active = ref(0);
const input = ref<HTMLInputElement>();

const results = computed(() => {
  const needle = query.value.trim().toLowerCase();
  if (!needle) return props.items;
  return props.items.filter((item) => [item.label, item.description ?? "", item.group ?? "", ...(item.keywords ?? [])].some((word) => word.toLowerCase().includes(needle)));
});
const groups = computed(() => [...new Set(results.value.map((item) => item.group ?? ""))]);

watch(results, () => (active.value = 0));
onMounted(() => props.autoFocus && input.value?.focus());

function onKeydown(event: KeyboardEvent) {
  const count = results.value.length;
  if (event.key === "ArrowDown" && count) active.value = (active.value + 1) % count;
  else if (event.key === "ArrowUp" && count) active.value = (active.value - 1 + count) % count;
  else if (event.key === "Home") active.value = 0;
  else if (event.key === "End") active.value = Math.max(0, count - 1);
  else if (event.key === "Enter" && results.value[active.value]) emit("select", results.value[active.value]);
  else if (event.key === "Escape") emit("close");
  else return;
  event.preventDefault();
  nextTick(() => document.getElementById(`${id}-option-${active.value}`)?.scrollIntoView({ block: "nearest" }));
}

const indexOf = (item: CommandItem) => results.value.indexOf(item);
</script>

<template>
  <div class="mc-command" role="dialog" :aria-label="label">
    <input
      ref="input"
      v-model="query"
      type="text"
      role="combobox"
      autocomplete="off"
      :class="['mc-command__input', classNames?.input]"
      :placeholder="placeholder"
      :aria-label="placeholder"
      aria-expanded="true"
      :aria-controls="`${id}-list`"
      :aria-activedescendant="results.length ? `${id}-option-${active}` : undefined"
      @keydown="onKeydown"
    />
    <div :id="`${id}-list`" role="listbox" :aria-label="label" :class="['mc-command__list', classNames?.list]">
      <p v-if="results.length === 0" :class="['mc-command__empty', classNames?.empty]">No results</p>
      <div v-for="group in groups" :key="group || 'all'" role="presentation">
        <div v-if="group" :class="['mc-command__group', classNames?.group]" role="presentation">{{ group }}</div>
        <div
          v-for="item in results.filter((entry) => (entry.group ?? '') === group)"
          :id="`${id}-option-${indexOf(item)}`"
          :key="item.id"
          role="option"
          :aria-selected="active === indexOf(item)"
          :class="['mc-command__item', classNames?.item]"
          @pointermove="active = indexOf(item)"
          @click="emit('select', item)"
        >
          <span class="mc-command__copy">
            <span>{{ item.label }}</span>
            <span v-if="item.description" class="mc-command__description">{{ item.description }}</span>
          </span>
          <kbd v-if="item.shortcut" class="mc-command__shortcut">{{ item.shortcut }}</kbd>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-command { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); color: var(--foreground); }
.mc-command__input { box-sizing: border-box; width: 100%; min-height: var(--control-height-lg); padding: 0 var(--space-4); border: 0; border-bottom: 1px solid var(--border); outline: 0; background: transparent; color: inherit; font: inherit; font-size: var(--text-sm); }
.mc-command__input::placeholder { color: var(--text-muted); }
.mc-command__list { max-height: 340px; padding: 6px; overflow: auto; }
.mc-command__group { padding: var(--space-2) var(--space-3) 4px; color: var(--text-muted); font-size: var(--text-xs); font-weight: 500; }
.mc-command__item { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control-height-md); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-command__item[aria-selected="true"] { background: var(--surface-muted); }
.mc-command__copy { display: grid; }
.mc-command__description { color: var(--text-muted); font-size: var(--text-xs); }
.mc-command__shortcut { color: var(--text-muted); font: inherit; font-size: var(--text-xs); }
.mc-command__empty { margin: 0; padding: var(--space-4); color: var(--text-muted); font-size: var(--text-sm); text-align: center; }
</style>
