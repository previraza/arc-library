<script lang="ts">
  import ColorPicker from "@/registry/components/color-picker/color-picker.svelte";
  let color = $state("#7747ff");
</script>

<div style="width: min(320px, 100%)">
  <ColorPicker bind:value={color} />
</div>
