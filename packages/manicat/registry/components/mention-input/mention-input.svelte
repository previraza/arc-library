<script lang="ts" module>
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
</script>

<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    people?: MentionPerson[];
    channels?: MentionChannel[];
    placeholder?: string;
    maxSuggestions?: number;
    minRows?: number;
    disabled?: boolean;
    ariaLabel?: string;
    /** `{ text, mentions }`. Type @ for people and # for channels. Bind it with `bind:value`. */
    value?: MentionValue;
    onmentionadd?: (mention: Mention) => void;
    /** Extend the inner, named parts of the mention input: input, suggestions or suggestion. */
    classNames?: { input?: string; suggestions?: string; suggestion?: string };
  }

  let { people = [], channels = [], placeholder = "Write a message…", maxSuggestions = 5, minRows = 3, disabled = false, ariaLabel = "Message", value = $bindable({ text: "", mentions: [] }), onmentionadd, classNames }: Props = $props();

  const id = $props.id();
  let area = $state<HTMLTextAreaElement>();
  let caret = $state(0);
  let active = $state(0);

  const trigger = $derived(/(^|\s)([@#])([\w-]*)$/.exec(value.text.slice(0, caret)));
  const kind = $derived<MentionKind | null>(trigger ? (trigger[2] === "@" ? "person" : "channel") : null);
  const suggestions = $derived.by(() => {
    const needle = (trigger?.[3] ?? "").toLowerCase();
    if (kind === "person") return people.filter((person) => person.name.toLowerCase().includes(needle)).slice(0, maxSuggestions).map((person) => ({ id: person.id, label: person.name, meta: person.role }));
    if (kind === "channel") return channels.filter((channel) => channel.name.toLowerCase().includes(needle)).slice(0, maxSuggestions).map((channel) => ({ id: channel.id, label: channel.name, meta: channel.members ? `${channel.members} members` : undefined }));
    return [];
  });

  function onInput(event: Event) {
    const text = (event.target as HTMLTextAreaElement).value;
    caret = (event.target as HTMLTextAreaElement).selectionStart;
    active = 0;
    // A mention whose text was edited is no longer a mention.
    value = { text, mentions: value.mentions.filter((entry) => text.slice(entry.start, entry.end) === entry.label) };
  }

  async function pick(index: number) {
    const suggestion = suggestions[index];
    const match = trigger;
    if (!suggestion || !match || !kind) return;
    const start = caret - (match[2].length + match[3].length);
    const label = `${match[2]}${suggestion.label}`;
    const { text, mentions } = value;
    const shift = label.length + 1 - (caret - start);
    const mention: Mention = { kind, id: suggestion.id, label, start, end: start + label.length };
    const moved = mentions.map((entry) => (entry.start >= caret ? { ...entry, start: entry.start + shift, end: entry.end + shift } : entry));
    value = { text: `${text.slice(0, start)}${label} ${text.slice(caret)}`, mentions: [...moved, mention].sort((a, b) => a.start - b.start) };
    onmentionadd?.(mention);
    await tick();
    const next = start + label.length + 1;
    area?.focus();
    area?.setSelectionRange(next, next);
    caret = next;
  }

  function onKeydown(event: KeyboardEvent) {
    if (!suggestions.length) return;
    const count = suggestions.length;
    if (event.key === "ArrowDown") active = (active + 1) % count;
    else if (event.key === "ArrowUp") active = (active - 1 + count) % count;
    else if (event.key === "Enter" || event.key === "Tab") pick(active);
    else if (event.key === "Escape") caret = -1;
    else return;
    event.preventDefault();
  }
</script>

<div class="mc-mention">
  <textarea
    bind:this={area}
    class={["mc-mention__input", classNames?.input]}
    value={value.text}
    rows={minRows}
    {placeholder}
    {disabled}
    aria-label={ariaLabel}
    role="combobox"
    aria-autocomplete="list"
    aria-expanded={suggestions.length > 0}
    aria-controls="{id}-list"
    aria-activedescendant={suggestions.length ? `${id}-option-${active}` : undefined}
    oninput={onInput}
    onkeydown={onKeydown}
    onkeyup={() => (caret = area?.selectionStart ?? 0)}
    onclick={() => (caret = area?.selectionStart ?? 0)}
  ></textarea>
  {#if suggestions.length}
    <ul id="{id}-list" role="listbox" class={["mc-mention__list", classNames?.suggestions]}>
      {#each suggestions as suggestion, index (suggestion.id)}
        <li id="{id}-option-{index}" role="option" aria-selected={active === index} class={["mc-mention__option", classNames?.suggestion]} onpointermove={() => (active = index)} onmousedown={(event) => { event.preventDefault(); pick(index); }}>
          <span>{kind === "person" ? "@" : "#"}{suggestion.label}</span>{#if suggestion.meta}<span class="mc-mention__meta">{suggestion.meta}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
:global {
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
}
</style>
