<script lang="ts">
  import SearchField from "@/registry/components/search-field/search-field.svelte";
  let query = $state("");
</script>

<div style="width: min(360px, 100%)">
  <SearchField label="Search" placeholder="Search components…" bind:value={query} />
</div>
