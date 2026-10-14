import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Avatar } from "@/registry/components/avatar/avatar.rn";
import { metrics, useTokens } from "@/lib/rn-tokens";

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

export interface CommentThreadProps extends Omit<ViewProps, "children"> {
  comments?: ThreadComment[];
  defaultComments?: ThreadComment[];
  onCommentsChange?: (comments: ThreadComment[], event: CommentThreadEvent) => void;
  currentUser: CommentAuthor;
  title?: string;
  reactions?: string[];
  placeholder?: string;
  maxDepth?: number;
  /** Extend the inner, named parts of the thread: comment, body, action or composer. The React Native counterpart of `classNames`. */
  styles?: {
    comment?: StyleProp<ViewStyle>;
    body?: StyleProp<TextStyle>;
    action?: StyleProp<TextStyle>;
    composer?: StyleProp<ViewStyle>;
  };
}

const map = (list: ThreadComment[], id: string, change: (comment: ThreadComment) => ThreadComment | null): ThreadComment[] =>
  list.flatMap((comment) => {
    if (comment.id === id) {
      const next = change(comment);
      return next ? [next] : [];
    }
    return [{ ...comment, replies: comment.replies ? map(comment.replies, id, change) : undefined }];
  });

const count = (list: ThreadComment[]): number => list.reduce((sum, comment) => sum + (comment.deleted ? 0 : 1) + count(comment.replies ?? []), 0);

/** A discussion with replies, edits, deletes and emoji reactions. Pass `comments` and `onCommentsChange` to own the data. */
export function CommentThread({ comments, defaultComments = [], onCommentsChange, currentUser, title = "Discussion", reactions = ["👍", "❤️"], placeholder = "Write a comment…", maxDepth = 3, style, styles: parts, ...props }: CommentThreadProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultComments);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const list = comments ?? internal;

  function commit(next: ThreadComment[], event: CommentThreadEvent) {
    if (comments === undefined) setInternal(next);
    onCommentsChange?.(next, event);
  }

  function submit() {
    const body = draft.trim();
    if (!body) return;
    if (editing) {
      commit(map(list, editing, (comment) => ({ ...comment, body, edited: true })), { type: "edit", id: editing, body });
    } else {
      const comment: ThreadComment = { id: `c-${Date.now()}`, author: currentUser, body, createdAt: "now" };
      const next = replyTo ? map(list, replyTo, (parent) => ({ ...parent, replies: [...(parent.replies ?? []), comment] })) : [...list, comment];
      commit(next, { type: "reply", comment, parentId: replyTo });
    }
    setDraft("");
    setReplyTo(null);
    setEditing(null);
  }

  function react(id: string, emoji: string) {
    let added = false;
    const next = map(list, id, (comment) => {
      const found = comment.reactions?.find((entry) => entry.emoji === emoji);
      const has = found?.users.includes(currentUser.id);
      added = !has;
      const users = has ? (found?.users ?? []).filter((user) => user !== currentUser.id) : [...(found?.users ?? []), currentUser.id];
      const rest = (comment.reactions ?? []).filter((entry) => entry.emoji !== emoji);
      return { ...comment, reactions: users.length ? [...rest, { emoji, users }] : rest };
    });
    commit(next, { type: "react", id, emoji, added });
  }

  function render(items: ThreadComment[], depth: number) {
    return items.map((comment) => (
      <View key={comment.id} style={[local.comment, { marginLeft: Math.min(depth, maxDepth) * 20, borderLeftColor: tokens.border, borderLeftWidth: depth ? 1 : 0 }, parts?.comment]}>
        <View style={local.head}>
          <Avatar name={comment.author.name} size="sm" src={comment.author.avatar} />
          <Text style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "600" }}>{comment.author.name}</Text>
          <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{comment.createdAt}{comment.edited ? " · edited" : ""}</Text>
        </View>
        <Text style={[{ color: comment.deleted ? tokens.textMuted : tokens.foreground, fontSize: metrics.text.sm, fontStyle: comment.deleted ? "italic" : "normal" }, parts?.body]}>{comment.deleted ? "This comment was deleted." : comment.body}</Text>
        {!comment.deleted ? (
          <View style={local.actions}>
            {comment.reactions?.map((reaction) => (
              <Pressable key={reaction.emoji} accessibilityRole="button" accessibilityState={{ selected: reaction.users.includes(currentUser.id) }} onPress={() => react(comment.id, reaction.emoji)} style={[local.reaction, { borderColor: reaction.users.includes(currentUser.id) ? tokens.foreground : tokens.border }]}>
                <Text style={{ fontSize: 12 }}>{reaction.emoji} {reaction.users.length}</Text>
              </Pressable>
            ))}
            {reactions.filter((emoji) => !comment.reactions?.some((entry) => entry.emoji === emoji)).map((emoji) => (
              <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`React ${emoji}`} onPress={() => react(comment.id, emoji)}>
                <Text style={{ fontSize: 13, opacity: 0.55 }}>{emoji}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => (setReplyTo(comment.id), setEditing(null), setDraft(""))}><Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.action]}>Reply</Text></Pressable>
            {comment.author.id === currentUser.id ? (
              <>
                <Pressable accessibilityRole="button" onPress={() => (setEditing(comment.id), setReplyTo(null), setDraft(comment.body))}><Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.action]}>Edit</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => commit(map(list, comment.id, (entry) => ({ ...entry, deleted: true, body: "" })), { type: "delete", id: comment.id })}><Text style={[{ color: tokens.danger, fontSize: metrics.text.xs }, parts?.action]}>Delete</Text></Pressable>
              </>
            ) : null}
          </View>
        ) : null}
        {comment.replies?.length ? render(comment.replies, depth + 1) : null}
      </View>
    ));
  }

  return (
    <View {...props} accessibilityLabel={title} style={[{ alignSelf: "stretch", gap: metrics.space[3], padding: metrics.space[4], borderWidth: 1, borderRadius: 26, borderColor: tokens.border, backgroundColor: tokens.surface }, style]}>
      <Text accessibilityRole="header" style={{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "600" }}>{title} · {count(list)}</Text>
      {list.length === 0 ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.sm }}>No comments yet.</Text> : render(list, 0)}
      <View style={[local.composer, parts?.composer]}>
        {replyTo || editing ? (
          <Pressable accessibilityRole="button" onPress={() => (setReplyTo(null), setEditing(null), setDraft(""))}>
            <Text style={{ color: tokens.textSecondary, fontSize: metrics.text.xs }}>{editing ? "Editing" : "Replying"} · Cancel</Text>
          </Pressable>
        ) : null}
        <View style={{ flexDirection: "row", gap: metrics.space[2] }}>
          <TextInput value={draft} onChangeText={setDraft} placeholder={placeholder} placeholderTextColor={tokens.textMuted} accessibilityLabel={placeholder} multiline style={[local.input, { color: tokens.foreground, backgroundColor: tokens.surfaceMuted }]} />
          <Pressable accessibilityRole="button" disabled={!draft.trim()} onPress={submit} style={[local.send, { backgroundColor: tokens.foreground, opacity: draft.trim() ? 1 : 0.4 }]}>
            <Text style={{ color: tokens.background, fontSize: metrics.text.sm, fontWeight: "500" }}>{editing ? "Save" : "Send"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  comment: { gap: 4, paddingLeft: 10, paddingVertical: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  reaction: { paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderRadius: 999 },
  composer: { gap: 6 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: metrics.space[3], paddingVertical: 10, borderRadius: 18, fontSize: metrics.text.sm },
  send: { paddingHorizontal: metrics.space[4], justifyContent: "center", borderRadius: 999 },
});

export default CommentThread;
