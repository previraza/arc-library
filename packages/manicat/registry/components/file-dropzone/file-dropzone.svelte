<script lang="ts" module>
  export type FileDropzoneStatus = "uploading" | "uploaded" | "failed";

  export interface FileDropzoneItem {
    id: string;
    name: string;
    size: number;
    status?: FileDropzoneStatus;
    /** 0 to 100 while uploading. */
    progress?: number;
    error?: string;
    retryable?: boolean;
    file?: File;
  }

  export type FileDropzoneUpload = (item: FileDropzoneItem, options: { onProgress: (percent: number) => void; signal: AbortSignal }) => Promise<void>;
</script>

<script lang="ts">
  interface Props {
    accept?: string;
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number;
    label?: string;
    description?: string;
    onUpload?: FileDropzoneUpload;
    note?: string;
    /** The list of files and their upload state. Bind it with `bind:items`. */
    items?: FileDropzoneItem[];
    onfileschange?: (files: File[]) => void;
    /** Extend the inner, named parts of the dropzone: zone, item, name, progress or note. */
    classNames?: { zone?: string; item?: string; name?: string; progress?: string; note?: string };
  }

  let { accept, multiple = true, maxFiles = Infinity, maxSize, label = "Add files", description, onUpload, note, items = $bindable([]), onfileschange, classNames }: Props = $props();

  const id = $props.id();
  let over = $state(false);
  let input = $state<HTMLInputElement>();
  const controllers = new Map<string, AbortController>();

  const size = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
  const patch = (itemId: string, change: Partial<FileDropzoneItem>) => (items = items.map((entry) => (entry.id === itemId ? { ...entry, ...change } : entry)));

  async function run(item: FileDropzoneItem) {
    if (!onUpload) return patch(item.id, { status: "uploaded", progress: 100 });
    const controller = new AbortController();
    controllers.set(item.id, controller);
    patch(item.id, { status: "uploading", progress: 0, error: undefined });
    try {
      await onUpload(item, { onProgress: (percent) => patch(item.id, { progress: percent }), signal: controller.signal });
      patch(item.id, { status: "uploaded", progress: 100 });
    } catch (error) {
      patch(item.id, { status: "failed", error: error instanceof Error ? error.message : "Upload failed", retryable: true });
    }
  }

  function add(list: FileList | File[]) {
    const files = [...list].slice(0, Math.max(0, maxFiles - items.length));
    const added: FileDropzoneItem[] = files.map((file, index) => (maxSize && file.size > maxSize ? { id: `f-${Date.now()}-${index}`, name: file.name, size: file.size, file, status: "failed", error: `Larger than ${size(maxSize)}` } : { id: `f-${Date.now()}-${index}`, name: file.name, size: file.size, file, status: "uploading", progress: 0 }));
    items = [...items, ...added];
    onfileschange?.(items.flatMap((item) => (item.file ? [item.file] : [])));
    added.filter((item) => item.status === "uploading").forEach(run);
  }

  function remove(itemId: string) {
    controllers.get(itemId)?.abort();
    items = items.filter((entry) => entry.id !== itemId);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    over = false;
    if (event.dataTransfer?.files.length) add(event.dataTransfer.files);
  }
</script>

<div class="mc-drop">
  <div
    class={["mc-drop__zone", classNames?.zone]}
    data-over={over || undefined}
    role="button"
    tabindex="0"
    aria-label={label}
    onclick={() => input?.click()}
    onkeydown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        input?.click();
      }
    }}
    ondragenter={(event) => {
      event.preventDefault();
      over = true;
    }}
    ondragover={(event) => {
      event.preventDefault();
      over = true;
    }}
    ondragleave={() => (over = false)}
    ondrop={onDrop}
  >
    <strong>{label}</strong>
    {#if description}<span>{description}</span>{/if}
    <small>Drop {multiple ? "files" : "a file"} here or click to choose</small>
    <input {id} bind:this={input} type="file" hidden {accept} {multiple} onchange={(event) => { add(event.currentTarget.files ?? []); event.currentTarget.value = ""; }} />
  </div>
  {#if note}<p class={["mc-drop__note", classNames?.note]}>{note}</p>{/if}
  <ul class="mc-drop__list" aria-live="polite">
    {#each items as item (item.id)}
      <li class={["mc-drop__item", classNames?.item]} data-status={item.status}>
        <div class="mc-drop__copy">
          <span class={["mc-drop__name", classNames?.name]}>{item.name}</span>
          <span class="mc-drop__meta">{item.status === "failed" ? item.error : item.status === "uploading" ? `Uploading ${Math.round(item.progress ?? 0)}%` : size(item.size)}</span>
          {#if item.status === "uploading"}<span class={["mc-drop__track", classNames?.progress]}><span style="width: {item.progress ?? 0}%"></span></span>{/if}
        </div>
        {#if item.status === "failed" && item.retryable}<button type="button" class="mc-drop__text" onclick={() => run(item)}>Retry</button>{/if}
        <button type="button" class="mc-drop__remove" aria-label="Remove {item.name}" onclick={() => remove(item.id)}>×</button>
      </li>
    {/each}
  </ul>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-drop { display: grid; gap: var(--space-3); }
.mc-drop__zone { display: grid; justify-items: center; gap: 4px; padding: var(--space-6) var(--space-5); border: 1.5px dashed var(--border-strong); border-radius: var(--radius-panel); background: var(--surface); text-align: center; cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); outline: none; }
.mc-drop__zone strong { font-size: var(--text-sm); } .mc-drop__zone span { color: var(--text-secondary); font-size: var(--text-xs); } .mc-drop__zone small { color: var(--text-muted); font-size: var(--text-xs); }
@media (hover: hover) and (pointer: fine) { .mc-drop__zone:hover { background: var(--surface-muted); } }
.mc-drop__zone[data-over], .mc-drop__zone:focus-visible { border-color: var(--foreground); background: var(--surface-muted); }
.mc-drop__note { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-drop__list { display: grid; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
.mc-drop__item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); } .mc-drop__item[data-status="failed"] { border-color: var(--danger); }
.mc-drop__copy { display: grid; flex: 1; gap: 4px; min-width: 0; } .mc-drop__name { overflow: hidden; font-size: var(--text-sm); text-overflow: ellipsis; white-space: nowrap; }
.mc-drop__meta { color: var(--text-muted); font-size: var(--text-xs); } .mc-drop__item[data-status="failed"] .mc-drop__meta { color: var(--danger); }
.mc-drop__track { display: block; height: 4px; overflow: hidden; border-radius: 2px; background: var(--surface-muted); } .mc-drop__track span { display: block; height: 100%; background: var(--accent); transition: width .3s var(--ease-standard); }
.mc-drop__text, .mc-drop__remove { padding: 0; border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; } .mc-drop__remove { font-size: 18px; color: var(--text-muted); }
@media (prefers-reduced-motion: reduce) { .mc-drop__zone, .mc-drop__track span { transition: none; } }
}
</style>
