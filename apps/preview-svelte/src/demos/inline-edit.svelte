<script lang="ts">
  import InlineEdit from "@/registry/components/inline-edit/inline-edit.svelte";
  let title = $state("Quarterly report");
</script>

<InlineEdit label="Title" bind:value={title} validate={(next) => (next.length > 40 ? "Keep it under 40 characters" : null)} />
