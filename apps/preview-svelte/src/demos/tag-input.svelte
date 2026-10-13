<script lang="ts">
  import TagInput from "@/registry/components/tag-input/tag-input.svelte";
  let tags = $state(["design", "svelte"]);
</script>

<div style="width: min(380px, 100%)">
  <TagInput label="Topics" description="Press Enter or comma to add." bind:tags />
</div>
