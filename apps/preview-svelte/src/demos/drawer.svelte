<script lang="ts">
  import Drawer from "@/registry/components/drawer/drawer.svelte";
  import Button from "@/registry/components/button/button.svelte";
</script>

<Drawer title="Notifications" description="Your latest activity.">
  {#snippet trigger({ open })}<Button variant="secondary" onclick={open}>Open drawer</Button>{/snippet}
  Nothing new right now.
</Drawer>
