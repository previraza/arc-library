<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";

export interface RichTextValue {
  html: string;
  markdown: string;
  text: string;
  empty: boolean;
}

withDefaults(
  defineProps<{
    placeholder?: string;
    readOnly?: boolean;
    ariaLabel?: string;
    /** Extend the inner, named parts of the editor: toolbar, tool or editor. */
    classNames?: { toolbar?: string; tool?: string; editor?: string };
  }>(),
  { placeholder: "Start typing…", readOnly: false, ariaLabel: "Editor" },
);

const emit = defineEmits<{ change: [value: RichTextValue] }>();
/** `v-model` binds the HTML. The `change` event also reports the Markdown and plain text. */
const html = defineModel<string>({ default: "" });
const editor = ref<HTMLElement>();
const active = ref<string[]>([]);

// A small HTML → Markdown conversion for the blocks the toolbar can make.
function toMarkdown(root: HTMLElement): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    const inner = [...node.childNodes].map(walk).join("");
    switch (node.tagName) {
      case "STRONG": case "B": return `**${inner}**`;
      case "EM": case "I": return `*${inner}*`;
      case "CODE": return `\`${inner}\``;
      case "H1": return `# ${inner}\n\n`;
      case "H2": return `## ${inner}\n\n`;
      case "H3": return `### ${inner}\n\n`;
      case "BLOCKQUOTE": return `> ${inner.trim()}\n\n`;
      case "LI": return `${node.parentElement?.tagName === "OL" ? `${[...node.parentElement.children].indexOf(node) + 1}.` : "-"} ${inner}\n`;
      case "UL": case "OL": return `${inner}\n`;
      case "BR": return "\n";
      case "P": case "DIV": return `${inner}\n\n`;
      default: return inner;
    }
  };
  return walk(root).replace(/\n{3,}/g, "\n\n").trim();
}

function report() {
  if (!editor.value) return;
  html.value = editor.value.innerHTML;
  const text = editor.value.innerText.replace(/​/g, "");
  emit("change", { html: html.value, markdown: toMarkdown(editor.value), text, empty: text.trim() === "" });
  refresh();
}

function refresh() {
  active.value = ["bold", "italic", "insertUnorderedList", "insertOrderedList"].filter((command) => document.queryCommandState(command));
}

// execCommand is deprecated but still the one API that edits rich text in place in every browser.
function run(command: string, value?: string) {
  editor.value?.focus();
  document.execCommand(command, false, value);
  report();
}

const tools: { name: string; label: string; command: string; value?: string; state?: string }[] = [
  { name: "Bold", label: "B", command: "bold", state: "bold" },
  { name: "Italic", label: "I", command: "italic", state: "italic" },
  { name: "Heading", label: "H", command: "formatBlock", value: "h2" },
  { name: "Bulleted list", label: "•", command: "insertUnorderedList", state: "insertUnorderedList" },
  { name: "Numbered list", label: "1.", command: "insertOrderedList", state: "insertOrderedList" },
  { name: "Quote", label: "❝", command: "formatBlock", value: "blockquote" },
];

onMounted(() => editor.value && (editor.value.innerHTML = html.value));
// Only a change from outside replaces the content, so typing never moves the caret.
watch(html, async (next) => {
  if (editor.value && editor.value.innerHTML !== next) {
    editor.value.innerHTML = next;
    await nextTick();
  }
});
</script>

<template>
  <div class="mc-rte">
    <div v-if="!readOnly" :class="['mc-rte__toolbar', classNames?.toolbar]" role="toolbar" aria-label="Formatting">
      <button v-for="tool in tools" :key="tool.name" type="button" :class="['mc-rte__tool', classNames?.tool]" :aria-label="tool.name" :aria-pressed="tool.state ? active.includes(tool.state) : undefined" @mousedown.prevent @click="run(tool.command, tool.value)">{{ tool.label }}</button>
    </div>
    <div ref="editor" :class="['mc-rte__editor', classNames?.editor]" role="textbox" aria-multiline="true" :aria-label="ariaLabel" :aria-placeholder="placeholder" :contenteditable="!readOnly" :data-placeholder="placeholder" :data-empty="!html || html === '<br>' || undefined" @input="report" @keyup="refresh" @mouseup="refresh" />
  </div>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-rte { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
.mc-rte__toolbar { display: flex; gap: 2px; padding: 4px; border-bottom: 1px solid var(--border); background: var(--surface-muted); overflow-x: auto; }
.mc-rte__tool { min-width: 36px; height: 36px; border: 0; border-radius: 10px; background: transparent; color: var(--foreground); font: inherit; font-size: var(--text-sm); cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-rte__tool:hover { background: var(--border); } } .mc-rte__tool[aria-pressed="true"] { background: var(--surface); box-shadow: var(--shadow-resting); }
.mc-rte__editor { min-height: 160px; padding: var(--space-4); outline: none; font-size: var(--text-sm); line-height: 1.55; }
.mc-rte__editor[data-empty]::before { content: attr(data-placeholder); color: var(--text-muted); pointer-events: none; }
.mc-rte__editor h1, .mc-rte__editor h2, .mc-rte__editor h3 { margin: .6em 0 .3em; letter-spacing: var(--tracking-body); } .mc-rte__editor h2 { font-size: var(--text-lg); }
.mc-rte__editor blockquote { margin: .6em 0; padding-left: var(--space-3); border-left: 2px solid var(--border-strong); color: var(--text-secondary); }
.mc-rte__editor code { padding: 1px 4px; border-radius: 4px; background: var(--surface-muted); font-size: .9em; }
</style>
