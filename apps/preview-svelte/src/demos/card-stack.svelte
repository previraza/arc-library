<script lang="ts">
  import CardStack from "@/registry/components/card-stack/card-stack.svelte";
  const items = [{ id: "a", name: "Lisbon" }, { id: "b", name: "Kyoto" }, { id: "c", name: "Oslo" }];
</script>

<div style="width: min(320px, 100%)">
  <CardStack {items} getKey={(item) => item.id} getLabel={(item) => item.name} label="Destinations">
    {#snippet card(item)}<div style="padding: 48px 16px; text-align: center; font-size: 20px; font-weight: 600">{item.name}</div>{/snippet}
  </CardStack>
</div>
