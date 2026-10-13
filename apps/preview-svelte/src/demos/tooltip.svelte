<script lang="ts">
  import Tooltip from "@/registry/components/tooltip/tooltip.svelte";
  import Button from "@/registry/components/button/button.svelte";
</script>

<div style="display: flex; gap: 16px; padding-top: 32px">
  <Tooltip content="Save your changes"><Button variant="secondary">Save</Button></Tooltip>
  <Tooltip content="Below the button" side="bottom"><Button variant="secondary">Bottom</Button></Tooltip>
</div>
