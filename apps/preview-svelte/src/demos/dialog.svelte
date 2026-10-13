<script lang="ts">
  import Dialog from "@/registry/components/dialog/dialog.svelte";
  import Button from "@/registry/components/button/button.svelte";
</script>

<Dialog title="Delete project" description="This cannot be undone.">
  {#snippet trigger({ open })}<Button variant="secondary" onclick={open}>Delete…</Button>{/snippet}
  All files and history will be removed for good.
</Dialog>
