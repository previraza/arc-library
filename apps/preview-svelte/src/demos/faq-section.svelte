<script lang="ts">
  import FaqSection from "@/registry/blocks/faq-section/faq-section.svelte";
</script>

<div style="width: min(640px, 100%); display: grid; gap: 32px">
  <FaqSection />
  <FaqSection variant="search" />
</div>
