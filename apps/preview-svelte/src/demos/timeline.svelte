<script lang="ts">
  import Timeline from "@/registry/components/timeline/timeline.svelte";
  const now = Date.now();
  const events = [
    { id: "1", at: now - 4 * 60_000, actor: "Ada", title: "merged the release", tone: "success" as const },
    { id: "2", at: now - 3 * 3600_000, title: "Build failed", meta: "web · 2m 14s", tone: "danger" as const },
    { id: "3", at: now - 26 * 3600_000, actor: "Lin", title: "opened the pull request" },
  ];
</script>

<div style="width: min(420px, 100%)">
  <Timeline label="Activity" {now} {events} />
</div>
