<script lang="ts">
  import AvatarGroup from "@/registry/components/avatar-group/avatar-group.svelte";

  const members = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Katherine Johnson", "Linus Torvalds", "Margaret Hamilton"].map((name) => ({ name }));
</script>

<AvatarGroup {members} max={4} />
