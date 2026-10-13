<script lang="ts" module>
  export interface CommentAuthor {
    id: string;
    name: string;
    avatar?: string;
  }

  export interface CommentReaction {
    emoji: string;
    users: string[];
  }

  export interface ThreadComment {
    id: string;
    author: CommentAuthor;
    body: string;
    createdAt: string;
    edited?: boolean;
    deleted?: boolean;
    reactions?: CommentReaction[];
    replies?: ThreadComment[];
  }

  export type CommentThreadEvent =
    | { type: "reply"; comment: ThreadComment; parentId: string | null }
    | { type: "edit"; id: string; body: string }
    | { type: "delete"; id: string }
    | { type: "react"; id: string; emoji: string; added: boolean };
</script>

<script lang="ts">
  import Avatar from "@/registry/components/avatar/avatar.svelte";

  interface Props {
    currentUser: CommentAuthor;
    title?: string;
    reactions?: string[];
    placeholder?: string;
    maxDepth?: number;
    /** The comments; replying, editing, deleting and reacting update them. Bind them with `bind:comments`. */
    comments?: ThreadComment[];
    onchange?: (event: CommentThreadEvent) => void;
    /** Extend the inner, named parts of the thread: comment, body, action or composer. */
    classNames?: { comment?: string; body?: string; action?: string; composer?: string };
  }

  interface Row {
    comment: ThreadComment;
    depth: number;
  }

  let { currentUser, title = "Discussion", reactions = ["👍", "❤️"], placeholder = "Write a comment…", maxDepth = 3, comments = $bindable([]), onchange, classNames }: Props = $props();

  let replyTo = $state<string | null>(null);
  let editing = $state<string | null>(null);
  let draft = $state("");

  const map = (list: ThreadComment[], id: string, change: (comment: ThreadComment) => ThreadComment): ThreadComment[] =>
    list.map((comment) => (comment.id === id ? change(comment) : { ...comment, replies: comment.replies ? map(comment.replies, id, change) : undefined }));
  const total = (list: ThreadComment[]): number => list.reduce((sum, comment) => sum + (comment.deleted ? 0 : 1) + total(comment.replies ?? []), 0);

  const rows = $derived.by(() => {
    const out: Row[] = [];
    const walk = (list: ThreadComment[], depth: number) => list.forEach((comment) => (out.push({ comment, depth }), walk(comment.replies ?? [], depth + 1)));
    walk(comments, 0);
    return out;
  });

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (editing) {
      comments = map(comments, editing, (comment) => ({ ...comment, body, edited: true }));
      onchange?.({ type: "edit", id: editing, body });
    } else {
      const comment: ThreadComment = { id: `c-${Date.now()}`, author: currentUser, body, createdAt: "now" };
      comments = replyTo ? map(comments, replyTo, (parent) => ({ ...parent, replies: [...(parent.replies ?? []), comment] })) : [...comments, comment];
      onchange?.({ type: "reply", comment, parentId: replyTo });
    }
    draft = "";
    replyTo = null;
    editing = null;
  }

  function react(id: string, emoji: string) {
    let added = false;
    comments = map(comments, id, (comment) => {
      const found = comment.reactions?.find((entry) => entry.emoji === emoji);
      const has = found?.users.includes(currentUser.id);
      added = !has;
      const users = has ? (found?.users ?? []).filter((user) => user !== currentUser.id) : [...(found?.users ?? []), currentUser.id];
      const rest = (comment.reactions ?? []).filter((entry) => entry.emoji !== emoji);
      return { ...comment, reactions: users.length ? [...rest, { emoji, users }] : rest };
    });
    onchange?.({ type: "react", id, emoji, added });
  }

  function remove(id: string) {
    comments = map(comments, id, (comment) => ({ ...comment, deleted: true, body: "" }));
    onchange?.({ type: "delete", id });
  }

  function reset() {
    replyTo = null;
    editing = null;
    draft = "";
  }
</script>

<section class="mc-comments" aria-label={title}>
  <h3 class="mc-comments__title">{title} · {total(comments)}</h3>
  {#if comments.length === 0}<p class="mc-comments__empty">No comments yet.</p>{/if}
  {#each rows as { comment, depth } (comment.id)}
    <article class={["mc-comments__comment", classNames?.comment]} style="margin-left: {Math.min(depth, maxDepth) * 20}px" data-nested={depth > 0 || undefined}>
      <header class="mc-comments__head"><Avatar name={comment.author.name} size="sm" src={comment.author.avatar} /><strong>{comment.author.name}</strong><span>{comment.createdAt}{comment.edited ? " · edited" : ""}</span></header>
      <p class={["mc-comments__body", { "mc-comments__body--deleted": comment.deleted }, classNames?.body]}>{comment.deleted ? "This comment was deleted." : comment.body}</p>
      {#if !comment.deleted}
        <div class="mc-comments__actions">
          {#each comment.reactions ?? [] as reaction (reaction.emoji)}
            <button type="button" class="mc-comments__reaction" aria-pressed={reaction.users.includes(currentUser.id)} onclick={() => react(comment.id, reaction.emoji)}>{reaction.emoji} {reaction.users.length}</button>
          {/each}
          {#each reactions.filter((e) => !comment.reactions?.some((entry) => entry.emoji === e)) as emoji (emoji)}
            <button type="button" class="mc-comments__add" aria-label="React {emoji}" onclick={() => react(comment.id, emoji)}>{emoji}</button>
          {/each}
          <button type="button" class={classNames?.action} onclick={() => { replyTo = comment.id; editing = null; draft = ""; }}>Reply</button>
          {#if comment.author.id === currentUser.id}
            <button type="button" class={classNames?.action} onclick={() => { editing = comment.id; replyTo = null; draft = comment.body; }}>Edit</button>
            <button type="button" class={["mc-comments__danger", classNames?.action]} onclick={() => remove(comment.id)}>Delete</button>
          {/if}
        </div>
      {/if}
    </article>
  {/each}
  <form class={["mc-comments__composer", classNames?.composer]} onsubmit={submit}>
    {#if replyTo || editing}<button type="button" class="mc-comments__cancel" onclick={reset}>{editing ? "Editing" : "Replying"} · Cancel</button>{/if}
    <div class="mc-comments__row"><textarea bind:value={draft} rows="1" {placeholder} aria-label={placeholder}></textarea><button type="submit" disabled={!draft.trim()}>{editing ? "Save" : "Send"}</button></div>
  </form>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-comments { display: grid; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
.mc-comments__title { margin: 0; font-size: var(--text-sm); font-weight: 600; } .mc-comments__empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
.mc-comments__comment { display: grid; gap: 4px; padding: 4px 0 4px 10px; } .mc-comments__comment[data-nested] { border-left: 1px solid var(--border); }
.mc-comments__head { display: flex; align-items: center; gap: 8px; font-size: var(--text-sm); } .mc-comments__head span { color: var(--text-muted); font-size: var(--text-xs); }
.mc-comments__body { margin: 0; font-size: var(--text-sm); } .mc-comments__body--deleted { color: var(--text-muted); font-style: italic; }
.mc-comments__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.mc-comments__actions button { padding: 0; border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-comments__actions .mc-comments__reaction { padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--radius-pill); color: var(--foreground); } .mc-comments__reaction[aria-pressed="true"] { border-color: var(--foreground); }
.mc-comments__add { opacity: .55; font-size: 13px; } .mc-comments__danger { color: var(--danger) !important; }
.mc-comments__composer { display: grid; gap: 6px; } .mc-comments__cancel { justify-self: start; padding: 0; border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-xs); cursor: pointer; }
.mc-comments__row { display: flex; gap: var(--space-2); }
.mc-comments__row textarea { flex: 1; min-height: 40px; max-height: 120px; padding: 10px var(--space-3); resize: vertical; border: 0; border-radius: 18px; outline: 0; background: var(--surface-muted); color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-comments__row button { padding: 0 var(--space-4); border: 0; border-radius: var(--radius-pill); background: var(--foreground); color: var(--background); font: inherit; font-size: var(--text-sm); font-weight: 500; cursor: pointer; } .mc-comments__row button:disabled { opacity: .4; cursor: not-allowed; }
}
</style>
