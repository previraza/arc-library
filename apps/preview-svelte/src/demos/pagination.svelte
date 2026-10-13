<script lang="ts">
  import Pagination from "@/registry/components/pagination/pagination.svelte";
  let page = $state(3);
</script>

<Pagination pageCount={12} bind:page />
