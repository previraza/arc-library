<script lang="ts">
  import Accordion from "@/registry/components/accordion/accordion.svelte";
</script>

<div style="width: min(460px, 100%)">
  <Accordion
    defaultOpen={0}
    items={[
      { title: "Is it accessible?", content: "Yes. It follows the WAI-ARIA pattern for accordions." },
      { title: "Can I restyle it?", content: "Every part takes a class through classNames." },
      { title: "Does it animate?", content: "It does, unless the reader prefers reduced motion." },
    ]}
  />
</div>
