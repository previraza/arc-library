<script lang="ts" module>
  export interface RichTextValue {
    html: string;
    markdown: string;
    text: string;
    empty: boolean;
  }
</script>

<script lang="ts">
  interface Props {
    placeholder?: string;
    readOnly?: boolean;
    ariaLabel?: string;
    /** The HTML. Bind it with `bind:html`. `onchange` also reports the Markdown and plain text. */
    html?: string;
    onchange?: (value: RichTextValue) => void;
    /** Extend the inner, named parts of the editor: toolbar, tool or editor. */
    classNames?: { toolbar?: string; tool?: string; editor?: string };
  }

  let { placeholder = "Start typing…", readOnly = false, ariaLabel = "Editor", html = $bindable(""), onchange, classNames }: Props = $props();

  let editor = $state<HTMLElement>();
  let active = $state<string[]>([]);

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
    if (!editor) return;
    html = editor.innerHTML;
    const text = editor.innerText.replace(/\u200b/g, "");
    onchange?.({ html, markdown: toMarkdown(editor), text, empty: text.trim() === "" });
    refresh();
  }

  function refresh() {
    active = ["bold", "italic", "insertUnorderedList", "insertOrderedList"].filter((command) => document.queryCommandState(command));
  }

  // execCommand is deprecated but still the one API that edits rich text in place in every browser.
  function run(command: string, value?: string) {
    editor?.focus();
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

  // Only a change from outside replaces the content, so typing never moves the caret.
  $effect(() => {
    if (editor && editor.innerHTML !== html) editor.innerHTML = html;
  });
</script>

<div class="mc-rte">
  {#if !readOnly}
    <div class={["mc-rte__toolbar", classNames?.toolbar]} role="toolbar" aria-label="Formatting">
      {#each tools as tool (tool.name)}
        <button type="button" class={["mc-rte__tool", classNames?.tool]} aria-label={tool.name} aria-pressed={tool.state ? active.includes(tool.state) : undefined} onmousedown={(event) => event.preventDefault()} onclick={() => run(tool.command, tool.value)}>{tool.label}</button>
      {/each}
    </div>
  {/if}
  <div
    bind:this={editor}
    class={["mc-rte__editor", classNames?.editor]}
    role="textbox"
    tabindex="0"
    aria-multiline="true"
    aria-label={ariaLabel}
    aria-placeholder={placeholder}
    contenteditable={!readOnly}
    data-placeholder={placeholder}
    data-empty={!html || html === "<br>" || undefined}
    oninput={report}
    onkeyup={refresh}
    onmouseup={refresh}
  ></div>
</div>

<style>
:global {
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
}
</style>
