<script lang="ts">
  import Toast from "@/registry/components/toast/toast.svelte";
  import Button from "@/registry/components/button/button.svelte";
  let open = $state(false);
</script>

<Button variant="secondary" onclick={() => (open = true)}>Show toast</Button>
<Toast bind:open title="Saved" description="Your changes are live." />
