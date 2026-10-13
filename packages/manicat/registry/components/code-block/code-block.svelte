<script lang="ts">
  interface Props {
    code: string;
    filename?: string;
    language?: string;
    /** Shows only this many lines until expanded. */
    maxLines?: number;
    /** Extend the inner, named parts of the block: header, filename, language, copy, pre or code. */
    classNames?: { header?: string; filename?: string; language?: string; copy?: string; pre?: string; code?: string };
  }

  let { code, filename, language = "tsx", maxLines, classNames }: Props = $props();

  let expanded = $state(false);
  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const lines = $derived(code.replace(/\n$/, "").split("\n"));
  const shown = $derived(maxLines && !expanded ? lines.slice(0, maxLines) : lines);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      clearTimeout(timer);
      timer = setTimeout(() => (copied = false), 1600);
    } catch {
      copied = false;
    }
  }

  $effect(() => () => clearTimeout(timer));
</script>

<figure class="mc-code">
  <figcaption class={["mc-code__header", classNames?.header]}>
    <span class={["mc-code__filename", classNames?.filename]}>{filename}</span>
    <span class={["mc-code__language", classNames?.language]}>{language}</span>
    <button type="button" class={["mc-code__copy", classNames?.copy]} aria-label={copied ? "Copied" : "Copy code"} onclick={copy}>{copied ? "Copied" : "Copy"}</button>
  </figcaption>
  <pre class={["mc-code__pre", classNames?.pre]}><code class={classNames?.code}>{#each shown as line, index (index)}<span class="mc-code__line"><span class="mc-code__number" aria-hidden="true">{index + 1}</span>{line || " "}
</span>{/each}</code></pre>
  {#if maxLines && lines.length > maxLines}
    <button type="button" class="mc-code__more" onclick={() => (expanded = !expanded)}>{expanded ? "Show less" : `Show ${lines.length - maxLines} more lines`}</button>
  {/if}
</figure>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. Add a highlighter such as Shiki for colours. */
.mc-code { margin: 0; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--background); }
.mc-code__header { display: flex; align-items: center; gap: var(--space-2); padding: 6px var(--space-3); border-bottom: 1px solid var(--border); background: var(--surface); }
.mc-code__filename { flex: 1; min-width: 0; overflow: hidden; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.mc-code__language { padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--radius-pill); color: var(--text-muted); font-size: 10px; letter-spacing: .04em; text-transform: uppercase; }
.mc-code__copy { padding: 2px 10px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: transparent; color: var(--text-secondary); font: inherit; font-size: 11px; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-code__copy:hover { color: var(--foreground); } }
.mc-code__pre { margin: 0; padding: var(--space-4); overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 1.6; }
.mc-code__line { display: block; }
.mc-code__number { display: inline-block; min-width: 2ch; margin-right: 1.5ch; color: var(--text-muted); text-align: right; user-select: none; }
.mc-code__more { display: block; width: 100%; padding: 10px; border: 0; border-top: 1px solid var(--border); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; }
}
</style>
