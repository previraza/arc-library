<script lang="ts">
  import MultiSelect from "@/registry/components/multi-select/multi-select.svelte";
  let value = $state(["design"]);
</script>

<div style="width: min(320px, 100%)">
  <MultiSelect label="Teams" description="Pick one or more." bind:value options={[{ value: "design", label: "Design" }, { value: "eng", label: "Engineering" }, { value: "ops", label: "Operations" }, { value: "legal", label: "Legal", disabled: true }]} />
</div>
