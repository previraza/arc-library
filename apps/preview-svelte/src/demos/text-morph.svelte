<script lang="ts">
  import TextMorph from "@/registry/components/text-morph/text-morph.svelte";
  const words = ["Ship", "Design", "Build"];
  let index = $state(0);
</script>

<div style="display: flex; gap: 12px; align-items: center">
  <TextMorph as="strong" text={words[index]} />
  <button type="button" onclick={() => (index = (index + 1) % words.length)}>Next</button>
</div>
