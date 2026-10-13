<script lang="ts">
  import FileDropzone, { type FileDropzoneItem } from "@/registry/components/file-dropzone/file-dropzone.svelte";
  let items = $state<FileDropzoneItem[]>([]);

  // A fake upload that reports progress, so the states are visible.
  async function upload(_item: FileDropzoneItem, { onProgress }: { onProgress: (percent: number) => void }) {
    for (let step = 1; step <= 10; step += 1) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      onProgress(step * 10);
    }
  }
</script>

<div style="width: min(420px, 100%)">
  <FileDropzone bind:items onUpload={upload} description="Images up to 5 MB" maxSize={5_000_000} />
</div>
