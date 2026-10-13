<script lang="ts">
  import BottomSheet from "@/registry/components/bottom-sheet/bottom-sheet.svelte";
  import Button from "@/registry/components/button/button.svelte";
</script>

<BottomSheet title="Filters" description="Narrow the list.">
  {#snippet trigger({ open })}<Button variant="secondary" onclick={open}>Open sheet</Button>{/snippet}
  Pick the filters to apply to the list.
</BottomSheet>
