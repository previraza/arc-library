<script lang="ts" module>
  export interface FileUploadItem {
    id: string;
    file: File;
    error?: string;
  }
</script>

<script lang="ts">
  interface Props {
    accept?: string;
    disabled?: boolean;
    label?: string;
    description?: string;
    multiple?: boolean;
    /** Largest file in bytes; bigger ones are listed with an error. */
    maxSize?: number;
    /** The chosen files. Bind them with `bind:files`. Uploading them is up to you. */
    files?: FileUploadItem[];
    /** Extend the inner, named parts of the upload: button, item or name. */
    classNames?: { button?: string; item?: string; name?: string };
  }

  let { accept, disabled = false, label = "Upload a file", description, multiple = false, maxSize, files = $bindable([]), classNames }: Props = $props();
  const id = $props.id();
  let input = $state<HTMLInputElement>();

  const size = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

  function onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const chosen = [...(target.files ?? [])].map((file, index): FileUploadItem => ({ id: `f-${Date.now()}-${index}`, file, error: maxSize && file.size > maxSize ? `Larger than ${size(maxSize)}` : undefined }));
    files = multiple ? [...files, ...chosen] : chosen.slice(0, 1);
    target.value = "";
  }
</script>

<div class="mc-upload">
  <input {id} bind:this={input} type="file" hidden {accept} {multiple} {disabled} onchange={onChange} />
  <button type="button" class={["mc-upload__button", classNames?.button]} {disabled} onclick={() => input?.click()}>{label}</button>
  {#if description}<p class="mc-upload__description">{description}</p>{/if}
  <ul class="mc-upload__list" aria-live="polite">
    {#each files as item (item.id)}
      <li class={["mc-upload__item", classNames?.item]} data-invalid={item.error ? "" : undefined}>
        <span class="mc-upload__copy"><span class={["mc-upload__name", classNames?.name]}>{item.file.name}</span><small>{item.error ?? size(item.file.size)}</small></span>
        <button type="button" class="mc-upload__remove" aria-label="Remove {item.file.name}" onclick={() => (files = files.filter((entry) => entry.id !== item.id))}>×</button>
      </li>
    {/each}
  </ul>
</div>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-upload { display: grid; gap: var(--space-2); justify-items: start; }
.mc-upload__button { min-height: var(--control-height-md); padding: 0 var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-control); background: var(--surface); color: var(--foreground); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; }
@media (hover: hover) and (pointer: fine) { .mc-upload__button:hover:not(:disabled) { background: var(--surface-muted); } } .mc-upload__button:disabled { opacity: .5; cursor: not-allowed; }
.mc-upload__description { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-upload__list { display: grid; gap: var(--space-2); width: 100%; margin: 0; padding: 0; list-style: none; }
.mc-upload__item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-control); } .mc-upload__item[data-invalid] { border-color: var(--danger); }
.mc-upload__copy { display: grid; flex: 1; min-width: 0; } .mc-upload__name { overflow: hidden; font-size: var(--text-sm); text-overflow: ellipsis; white-space: nowrap; } .mc-upload__copy small { color: var(--text-muted); font-size: var(--text-xs); } .mc-upload__item[data-invalid] small { color: var(--danger); }
.mc-upload__remove { border: 0; background: transparent; color: var(--text-muted); font: inherit; font-size: 18px; cursor: pointer; }
}
</style>
