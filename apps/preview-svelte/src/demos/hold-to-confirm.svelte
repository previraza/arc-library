<script lang="ts">
  import HoldToConfirm from "@/registry/components/hold-to-confirm/hold-to-confirm.svelte";
  let message = $state("");
</script>

<div style="display: grid; gap: 8px; justify-items: start">
  <HoldToConfirm label="Hold to delete" tone="danger" confirmedLabel="Deleted" onconfirm={() => (message = "Confirmed")} />
  <small>{message}</small>
</div>
