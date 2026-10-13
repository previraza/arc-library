<script lang="ts">
  import Calendar from "@/registry/components/calendar/calendar.svelte";
  let day = $state<Date | undefined>(new Date());
</script>

<div style="display: grid; gap: 8px; justify-items: start">
  <Calendar bind:value={day} />
  <small>{day?.toDateString()}</small>
</div>
