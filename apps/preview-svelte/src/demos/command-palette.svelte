<script lang="ts">
  import CommandPalette from "@/registry/components/command-palette/command-palette.svelte";
  let chosen = $state("");
</script>

<div style="width: min(420px, 100%); display: grid; gap: 8px">
  <CommandPalette
    onselect={(item) => (chosen = item.label)}
    items={[
      { id: "new", label: "New file", group: "File", shortcut: "⌘N" },
      { id: "open", label: "Open…", group: "File", shortcut: "⌘O" },
      { id: "theme", label: "Toggle theme", group: "View", description: "Switch light and dark" },
    ]}
  />
  <small>{chosen && `Chose ${chosen}`}</small>
</div>
