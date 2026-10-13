<script lang="ts">
  import CodeBlock from "@/registry/components/code-block/code-block.svelte";
  const code = `import { Button } from "@/components/ui/button";

export function Page() {
  return <Button>Save</Button>;
}

export default Page;
`;
</script>

<div style="width: min(520px, 100%)">
  <CodeBlock {code} filename="page.tsx" maxLines={4} />
</div>
