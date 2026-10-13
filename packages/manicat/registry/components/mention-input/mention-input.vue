<script setup lang="ts">
import { computed, nextTick, ref, useId } from "vue";

export type MentionKind = "person" | "channel";

export interface MentionPerson {
  id: string;
  name: string;
  role?: string;
}

export interface MentionChannel {
  id: string;
  name: string;
  members?: number;
}

export interface Mention {
  kind: MentionKind;
  id: string;
  label: string;
  start: number;
  end: number;
}

export interface MentionValue {
  text: string;
  mentions: Mention[];
}

const props = withDefaults(
  defineProps<{
    people?: MentionPerson[];
    channels?: MentionChannel[];
    placeholder?: string;
    maxSuggestions?: number;
    minRows?: number;
    disabled?: boolean;
    ariaLabel?: string;
    /** Extend the inner, named parts of the mention input: input, suggestions or suggestion. */
    classNames?: { input?: string; suggestions?: string; suggestion?: string };
  }>(),
  { people: () => [], channels: () => [], placeholder: "Write a message…", maxSuggestions: 5, minRows: 3, disabled: false, ariaLabel: "Message" },
);

const emit = defineEmits<{ mentionAdd: [mention: Mention] }>();
/** `v-model` binds `{ text, mentions }`. Type @ for people and # for channels. */
const model = defineModel<MentionValue>({ default: () => ({ text: "", mentions: [] }) });
const id = useId();
const area = ref<HTMLTextAreaElement>();
const caret = ref(0);
const active = ref(0);

const trigger = computed(() => /(^|\s)([@#])([\w-]*)$/.exec(model.value.text.slice(0, caret.value)));
const kind = computed<MentionKind | null>(() => (trigger.value ? (trigger.value[2] === "@" ? "person" : "channel") : null));
const suggestions = computed(() => {
  const needle = (trigger.value?.[3] ?? "").toLowerCase();
  if (kind.value === "person") return props.people.filter((person) => person.name.toLowerCase().includes(needle)).slice(0, props.maxSuggestions).map((person) => ({ id: person.id, label: person.name, meta: person.role }));
  if (kind.value === "channel") return props.channels.filter((channel) => channel.name.toLowerCase().includes(needle)).slice(0, props.maxSuggestions).map((channel) => ({ id: channel.id, label: channel.name, meta: channel.members ? `${channel.members} members` : undefined }));
  return [];
});

function onInput(event: Event) {
  const text = (event.target as HTMLTextAreaElement).value;
  caret.value = (event.target as HTMLTextAreaElement).selectionStart;
  active.value = 0;
  // A mention whose text was edited is no longer a mention.
  model.value = { text, mentions: model.value.mentions.filter((entry) => text.slice(entry.start, entry.end) === entry.label) };
}

async function pick(index: number) {
  const suggestion = suggestions.value[index];
  const match = trigger.value;
  if (!suggestion || !match || !kind.value) return;
  const start = caret.value - (match[2].length + match[3].length);
  const label = `${match[2]}${suggestion.label}`;
  const { text, mentions } = model.value;
  const shift = label.length + 1 - (caret.value - start);
  const mention: Mention = { kind: kind.value, id: suggestion.id, label, start, end: start + label.length };
  const moved = mentions.map((entry) => (entry.start >= caret.value ? { ...entry, start: entry.start + shift, end: entry.end + shift } : entry));
  model.value = { text: `${text.slice(0, start)}${label} ${text.slice(caret.value)}`, mentions: [...moved, mention].sort((a, b) => a.start - b.start) };
  emit("mentionAdd", mention);
  await nextTick();
  const next = start + label.length + 1;
  area.value?.focus();
  area.value?.setSelectionRange(next, next);
  caret.value = next;
}

function onKeydown(event: KeyboardEvent) {
  if (!suggestions.value.length) return;
  const count = suggestions.value.length;
  if (event.key === "ArrowDown") active.value = (active.value + 1) % count;
  else if (event.key === "ArrowUp") active.value = (active.value - 1 + count) % count;
  else if (event.key === "Enter" || event.key === "Tab") pick(active.value);
  else if (event.key === "Escape") caret.value = -1;
  else return;
  event.preventDefault();
}
</script>

<template>
  <div class="mc-mention">
    <textarea
      ref="area"
      :class="['mc-mention__input', classNames?.input]"
      :value="model.text"
      :rows="minRows"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-label="ariaLabel"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="suggestions.length > 0"
      :aria-controls="`${id}-list`"
      :aria-activedescendant="suggestions.length ? `${id}-option-${active}` : undefined"
      @input="onInput"
      @keydown="onKeydown"
      @keyup="caret = area?.selectionStart ?? 0"
      @click="caret = area?.selectionStart ?? 0"
    />
    <ul v-if="suggestions.length" :id="`${id}-list`" role="listbox" :class="['mc-mention__list', classNames?.suggestions]">
      <li v-for="(suggestion, index) in suggestions" :id="`${id}-option-${index}`" :key="suggestion.id" role="option" :aria-selected="active === index" :class="['mc-mention__option', classNames?.suggestion]" @pointermove="active = index" @mousedown.prevent="pick(index)">
        <span>{{ kind === "person" ? "@" : "#" }}{{ suggestion.label }}</span><span v-if="suggestion.meta" class="mc-mention__meta">{{ suggestion.meta }}</span>
      </li>
    </ul>
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-mention { position: relative; }
.mc-mention__input { box-sizing: border-box; width: 100%; min-height: 88px; padding: var(--space-3); resize: vertical; border: 1px solid var(--border-strong); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); transition: border-color var(--duration-fast) var(--ease-standard); }
.mc-mention__input::placeholder { color: var(--text-muted); }
.mc-mention__input:focus-visible { border-color: var(--foreground); outline: none; }
.mc-mention__list { position: absolute; z-index: 60; left: 0; top: calc(100% + 6px); width: min(100%, 18rem); margin: 0; padding: 4px; list-style: none; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface-raised); box-shadow: var(--shadow-floating); animation: mc-mention-in .16s var(--ease-enter) both; }
.mc-mention__option { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-height: var(--control-height-sm); padding: 0 var(--space-3); border-radius: calc(var(--radius-control) - 4px); font-size: var(--text-sm); cursor: pointer; }
.mc-mention__option[aria-selected="true"] { background: var(--surface-muted); }
.mc-mention__meta { color: var(--text-muted); font-size: var(--text-xs); }
@keyframes mc-mention-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .mc-mention__input { transition: none; } .mc-mention__list { animation: none; } }
</style>
