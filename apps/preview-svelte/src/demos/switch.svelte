<script lang="ts">
  import Switch from "@/registry/components/switch/switch.svelte";

  let notifications = $state(true);
</script>

<div style="display: grid; gap: 8px;">
  <Switch bind:checked={notifications} label="Email notifications" />
  <Switch label="Weekly digest" />
  <Switch label="Unavailable" disabled />
</div>
