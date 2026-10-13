<script setup lang="ts">
import { computed, ref } from "vue";
import Avatar from "@/registry/components/avatar/avatar.vue";

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

const props = withDefaults(
  defineProps<{
    currentUser: CommentAuthor;
    title?: string;
    reactions?: string[];
    placeholder?: string;
    maxDepth?: number;
    /** Extend the inner, named parts of the thread: comment, body, action or composer. */
    classNames?: { comment?: string; body?: string; action?: string; composer?: string };
  }>(),
  { title: "Discussion", reactions: () => ["👍", "❤️"], placeholder: "Write a comment…", maxDepth: 3 },
);

const emit = defineEmits<{ change: [event: CommentThreadEvent] }>();
/** `v-model` binds the comments; replying, editing, deleting and reacting update it. */
const comments = defineModel<ThreadComment[]>({ default: () => [] });
const replyTo = ref<string | null>(null);
const editing = ref<string | null>(null);
const draft = ref("");

interface Row {
  comment: ThreadComment;
  depth: number;
}

const map = (list: ThreadComment[], id: string, change: (comment: ThreadComment) => ThreadComment): ThreadComment[] =>
  list.map((comment) => (comment.id === id ? change(comment) : { ...comment, replies: comment.replies ? map(comment.replies, id, change) : undefined }));
const total = (list: ThreadComment[]): number => list.reduce((sum, comment) => sum + (comment.deleted ? 0 : 1) + total(comment.replies ?? []), 0);

const rows = computed(() => {
  const out: Row[] = [];
  const walk = (list: ThreadComment[], depth: number) => list.forEach((comment) => (out.push({ comment, depth }), walk(comment.replies ?? [], depth + 1)));
  walk(comments.value, 0);
  return out;
});

function submit() {
  const body = draft.value.trim();
  if (!body) return;
  if (editing.value) {
    comments.value = map(comments.value, editing.value, (comment) => ({ ...comment, body, edited: true }));
    emit("change", { type: "edit", id: editing.value, body });
  } else {
    const comment: ThreadComment = { id: `c-${Date.now()}`, author: props.currentUser, body, createdAt: "now" };
    comments.value = replyTo.value ? map(comments.value, replyTo.value, (parent) => ({ ...parent, replies: [...(parent.replies ?? []), comment] })) : [...comments.value, comment];
    emit("change", { type: "reply", comment, parentId: replyTo.value });
  }
  draft.value = "";
  replyTo.value = null;
  editing.value = null;
}

function react(id: string, emoji: string) {
  let added = false;
  comments.value = map(comments.value, id, (comment) => {
    const found = comment.reactions?.find((entry) => entry.emoji === emoji);
    const has = found?.users.includes(props.currentUser.id);
    added = !has;
    const users = has ? (found?.users ?? []).filter((user) => user !== props.currentUser.id) : [...(found?.users ?? []), props.currentUser.id];
    const rest = (comment.reactions ?? []).filter((entry) => entry.emoji !== emoji);
    return { ...comment, reactions: users.length ? [...rest, { emoji, users }] : rest };
  });
  emit("change", { type: "react", id, emoji, added });
}

function remove(id: string) {
  comments.value = map(comments.value, id, (comment) => ({ ...comment, deleted: true, body: "" }));
  emit("change", { type: "delete", id });
}

function reset() {
  replyTo.value = null;
  editing.value = null;
  draft.value = "";
}
</script>

<template>
  <section class="mc-comments" :aria-label="title">
    <h3 class="mc-comments__title">{{ title }} · {{ total(comments) }}</h3>
    <p v-if="comments.length === 0" class="mc-comments__empty">No comments yet.</p>
    <article v-for="{ comment, depth } in rows" :key="comment.id" :class="['mc-comments__comment', classNames?.comment]" :style="{ marginLeft: `${Math.min(depth, maxDepth) * 20}px` }" :data-nested="depth > 0 || undefined">
      <header class="mc-comments__head"><Avatar :name="comment.author.name" size="sm" :src="comment.author.avatar" /><strong>{{ comment.author.name }}</strong><span>{{ comment.createdAt }}{{ comment.edited ? " · edited" : "" }}</span></header>
      <p :class="['mc-comments__body', { 'mc-comments__body--deleted': comment.deleted }, classNames?.body]">{{ comment.deleted ? "This comment was deleted." : comment.body }}</p>
      <div v-if="!comment.deleted" class="mc-comments__actions">
        <button v-for="reaction in comment.reactions" :key="reaction.emoji" type="button" class="mc-comments__reaction" :aria-pressed="reaction.users.includes(currentUser.id)" @click="react(comment.id, reaction.emoji)">{{ reaction.emoji }} {{ reaction.users.length }}</button>
        <button v-for="emoji in reactions.filter((e) => !comment.reactions?.some((entry) => entry.emoji === e))" :key="emoji" type="button" class="mc-comments__add" :aria-label="`React ${emoji}`" @click="react(comment.id, emoji)">{{ emoji }}</button>
        <button type="button" :class="classNames?.action" @click="replyTo = comment.id; editing = null; draft = ''">Reply</button>
        <template v-if="comment.author.id === currentUser.id">
          <button type="button" :class="classNames?.action" @click="editing = comment.id; replyTo = null; draft = comment.body">Edit</button>
          <button type="button" class="mc-comments__danger" :class="classNames?.action" @click="remove(comment.id)">Delete</button>
        </template>
      </div>
    </article>
    <form :class="['mc-comments__composer', classNames?.composer]" @submit.prevent="submit">
      <button v-if="replyTo || editing" type="button" class="mc-comments__cancel" @click="reset">{{ editing ? "Editing" : "Replying" }} · Cancel</button>
      <div class="mc-comments__row"><textarea v-model="draft" rows="1" :placeholder="placeholder" :aria-label="placeholder" /><button type="submit" :disabled="!draft.trim()">{{ editing ? "Save" : "Send" }}</button></div>
    </form>
  </section>
</template>

<style>
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
</style>
