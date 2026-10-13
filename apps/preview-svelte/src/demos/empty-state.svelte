<script lang="ts">
  import EmptyState from "@/registry/components/empty-state/empty-state.svelte";
  import Button from "@/registry/components/button/button.svelte";
</script>

<EmptyState title="No projects yet" description="Create a project to start collaborating with your team.">
  {#snippet action()}<Button>New project</Button>{/snippet}
</EmptyState>
