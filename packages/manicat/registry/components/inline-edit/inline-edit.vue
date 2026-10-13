<script setup lang="ts">
import { nextTick, ref, useId } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    /** Return a message to block the save, or nothing when the value is fine. */
    validate?: (next: string) => string | null | undefined;
    placeholder?: string;
    multiline?: boolean;
    variant?: "title" | "body";
    /** Extend the inner, named parts of the inline edit: text, input or error. */
    classNames?: { text?: string; input?: string; error?: string };
  }>(),
  { placeholder: "", multiline: false, variant: "title" },
);

/** `v-model` binds the saved value; it only changes when an edit is committed. */
const model = defineModel<string>({ default: "" });
const emit = defineEmits<{ save: [next: string] }>();
const editing = ref(false);
const draft = ref("");
const error = ref<string | null>(null);
const field = ref<HTMLInputElement | HTMLTextAreaElement>();
const id = useId();

async function edit() {
  draft.value = model.value;
  editing.value = true;
  await nextTick();
  field.value?.focus();
  field.value?.select();
}

function commit() {
  const next = draft.value.trim();
  const problem = props.validate?.(next);
  if (problem) return (error.value = problem);
  error.value = null;
  editing.value = false;
  if (next && next !== model.value) {
    model.value = next;
    emit("save", next);
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    error.value = null;
    editing.value = false;
  } else if (event.key === "Enter" && (!props.multiline || event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    commit();
  }
}
</script>

<template>
  <span class="mc-inline" :data-variant="variant">
    <button v-if="!editing" type="button" :class="['mc-inline__text', classNames?.text]" :aria-label="`${label}: ${model || placeholder}. Edit`" @click="edit">{{ model || placeholder }}</button>
    <template v-else>
      <component :is="multiline ? 'textarea' : 'input'" :id="id" ref="field" v-model="draft" :class="['mc-inline__input', classNames?.input]" :aria-label="label" :aria-invalid="error ? true : undefined" @blur="commit" @keydown="onKeydown" />
      <span v-if="error" role="alert" :class="['mc-inline__error', classNames?.error]">{{ error }}</span>
    </template>
  </span>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-inline { display: inline-grid; gap: 4px; }
.mc-inline__text, .mc-inline__input { padding: 2px 6px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--foreground); font: inherit; text-align: left; }
.mc-inline[data-variant="title"] .mc-inline__text, .mc-inline[data-variant="title"] .mc-inline__input { font-size: var(--text-xl); font-weight: 600; letter-spacing: var(--tracking-display); }
.mc-inline__text { cursor: text; transition: background-color var(--duration-fast) var(--ease-standard); }
@media (hover: hover) and (pointer: fine) { .mc-inline__text:hover { background: var(--surface-muted); } }
.mc-inline__input { border-color: var(--border-strong); background: var(--surface); outline: 0; }
.mc-inline__input:focus { border-color: var(--foreground); }
.mc-inline__input[aria-invalid="true"] { border-color: var(--danger); }
.mc-inline__error { color: var(--danger); font-size: var(--text-xs); }
@media (prefers-reduced-motion: reduce) { .mc-inline__text { transition: none; } }
</style>
