<script lang="ts">
  import AnnouncementBar from "@/registry/components/announcement-bar/announcement-bar.svelte";
</script>

<div style="width: min(560px, 100%)">
  <AnnouncementBar
    interval={4000}
    messages={[
      { id: "v2", message: "Manicat 2.0 is out.", action: { label: "Read the notes", href: "#notes" } },
      { id: "svelte", message: "Svelte and Swift ports are in preview.", action: { label: "Try them" } },
    ]}
  />
</div>
