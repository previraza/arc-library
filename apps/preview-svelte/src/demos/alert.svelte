<script lang="ts">
  import Alert from "@/registry/components/alert/alert.svelte";

  let open = $state(true);
</script>

<div style="display: grid; gap: 10px; width: min(380px, 100%)">
  <Alert title="Heads up" {open} dismissible ondismiss={() => (open = false)}>Your trial ends in three days.</Alert>
  <Alert tone="success" title="Saved" />
  <Alert tone="warning" title="Almost full">You have used 92% of your storage.</Alert>
  <Alert tone="danger" title="Payment failed" />
</div>
