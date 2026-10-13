<script lang="ts">
  import UsageMeter from "@/registry/components/usage-meter/usage-meter.svelte";
</script>

<div style="width: min(420px, 100%)">
  <UsageMeter label="Storage" unit="GB" limit={50} segments={[{ id: "photos", label: "Photos", value: 18 }, { id: "docs", label: "Documents", value: 12 }, { id: "other", label: "Other", value: 9 }]} />
</div>
