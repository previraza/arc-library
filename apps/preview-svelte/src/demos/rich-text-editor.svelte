<script lang="ts">
  import RichTextEditor from "@/registry/components/rich-text-editor/rich-text-editor.svelte";
  let html = $state("<p>Edit <strong>me</strong>.</p>");
</script>

<div style="width: min(460px, 100%)">
  <RichTextEditor bind:html />
</div>
