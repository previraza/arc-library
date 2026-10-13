<script lang="ts">
  import ThemeSwitch, { type Theme } from "@/registry/components/theme-switch/theme-switch.svelte";
  let theme = $state<Theme>("light");
</script>

<div style="display: flex; gap: 12px">
  <ThemeSwitch bind:theme />
  <ThemeSwitch bind:theme iconOnly={false} />
</div>
