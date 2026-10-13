<script lang="ts">
  import DatePicker from "@/registry/components/date-picker/date-picker.svelte";
  let date = $state<Date | undefined>();
</script>

<div style="width: min(300px, 100%)">
  <DatePicker label="Due date" description="Pick a day." bind:value={date} />
</div>
