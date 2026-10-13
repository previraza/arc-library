<script lang="ts">
  import DateRangePicker, { type DateRange } from "@/registry/components/date-range-picker/date-range-picker.svelte";
  let range = $state<DateRange | null>(null);
</script>

<div style="width: min(320px, 100%)">
  <DateRangePicker bind:value={range} />
</div>
