<script lang="ts">
  import CommentThread, { type ThreadComment } from "@/registry/components/comment-thread/comment-thread.svelte";
  const me = { id: "me", name: "You" };
  let comments = $state<ThreadComment[]>([
    { id: "1", author: { id: "ada", name: "Ada" }, body: "Should we ship the Svelte ports this week?", createdAt: "2h ago", reactions: [{ emoji: "👍", users: ["lin"] }], replies: [{ id: "2", author: me, body: "Yes, parity checks are green.", createdAt: "1h ago" }] },
  ]);
</script>

<div style="width: min(460px, 100%)">
  <CommentThread currentUser={me} bind:comments />
</div>
