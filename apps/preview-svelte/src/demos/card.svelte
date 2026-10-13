<script lang="ts">
  import Card from "@/registry/components/card/card.svelte";
  import Button from "@/registry/components/button/button.svelte";
</script>

<div style="width: min(340px, 100%)">
  <Card title="Quarterly review" description="Slides and notes for the Q3 planning session." status="Draft">
    {#snippet meta()}Updated 2h ago{/snippet}
    {#snippet action()}<Button size="sm" variant="secondary">Open</Button>{/snippet}
  </Card>
</div>
