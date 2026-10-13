<script lang="ts">
  import Combobox from "@/registry/components/combobox/combobox.svelte";
  let framework = $state("");
</script>

<div style="width: min(300px, 100%)">
  <Combobox label="Framework" placeholder="Search…" bind:value={framework} options={[{ value: "react", label: "React" }, { value: "vue", label: "Vue" }, { value: "svelte", label: "Svelte", keywords: ["kit"] }, { value: "swift", label: "SwiftUI", keywords: ["ios"] }]} />
</div>
