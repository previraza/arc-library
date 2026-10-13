<script setup lang="ts">
import { ref, useId } from "vue";

withDefaults(
  defineProps<{
    label: string;
    placeholder?: string;
    description?: string;
    /** Extend the inner, named parts of the tag input: shell, tag, remove, input or hint. */
    classNames?: { shell?: string; tag?: string; remove?: string; input?: string; hint?: string };
  }>(),
  { placeholder: "Add a tag" },
);

/** `v-model` binds the list of tags. Enter or a comma adds one, Backspace on an empty field removes the last. */
const tags = defineModel<string[]>({ default: () => [] });
const draft = ref("");
const id = useId();

function add() {
  const tag = draft.value.trim().replace(/,$/, "");
  draft.value = "";
  if (tag && !tags.value.includes(tag)) tags.value = [...tags.value, tag];
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    add();
  } else if (event.key === "Backspace" && !draft.value && tags.value.length) {
    tags.value = tags.value.slice(0, -1);
  }
}

</script>

<template>
  <div class="mc-tags">
    <label :for="id" class="mc-tags__label">{{ label }}</label>
    <div :class="['mc-tags__shell', classNames?.shell]">
      <span v-for="tag in tags" :key="tag" :class="['mc-tags__tag', classNames?.tag]">
        {{ tag }}
        <button type="button" :class="['mc-tags__remove', classNames?.remove]" :aria-label="`Remove ${tag}`" @click="tags = tags.filter((entry) => entry !== tag)">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
        </button>
      </span>
      <input :id="id" v-model="draft" :class="['mc-tags__input', classNames?.input]" :placeholder="tags.length ? '' : placeholder" @keydown="onKeydown" @blur="add" />
    </div>
    <span v-if="description" :class="['mc-tags__hint', classNames?.hint]">{{ description }}</span>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-tags { display: grid; gap: var(--space-2); min-width: 0; }
.mc-tags__label { font-size: var(--text-sm); font-weight: 500; }
.mc-tags__shell { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: var(--control-height-md); padding: 6px; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); transition: border-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-tags__shell:hover { border-color: var(--foreground); } }
.mc-tags__shell:focus-within { border-color: var(--foreground); }
.mc-tags__tag { display: inline-flex; align-items: center; gap: 6px; padding: 3px 6px 3px 10px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface-muted); font-size: var(--text-xs); font-weight: 500; animation: mc-tag-in .18s var(--ease-enter) both; }
.mc-tags__remove { display: grid; place-items: center; width: 16px; height: 16px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--text-muted); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-tags__remove:hover { color: var(--foreground); background: var(--border); } }
.mc-tags__input { flex: 1 1 80px; min-width: 80px; padding: 4px 6px; border: 0; outline: 0; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-tags__input::placeholder { color: var(--text-muted); }
.mc-tags__hint { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-tag-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-tags__shell { transition: none; } .mc-tags__tag { animation: none; } }
</style>
