// @manicat-dependencies lucide-react-native react-native-svg
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Avatar } from "@/registry/components/avatar/avatar.rn";
import { metrics, useTokens } from "@/lib/rn-tokens";
import { ArrowUp } from "lucide-react-native";

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  mine?: boolean;
}

export type ChatMessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatMessage {
  id: string;
  authorId: string;
  text?: string;
  createdAt: Date | string | number;
  reactions?: ChatReaction[];
  status?: ChatMessageStatus;
}

export interface ChatThreadProps extends Omit<ViewProps, "children"> {
  participants: ChatParticipant[];
  currentUserId: string;
  messages?: ChatMessage[];
  defaultMessages?: ChatMessage[];
  typing?: string[];
  /** For each participant id, the id of the last message they have read. */
  readBy?: Record<string, string>;
  onSend?: (draft: { text: string }) => void | Promise<void>;
  onReact?: (messageId: string, emoji: string) => void;
  onRetry?: (messageId: string) => void;
  reactions?: string[];
  placeholder?: string;
  composer?: boolean;
  /** Messages within this many milliseconds from the same author share one bubble group. */
  groupWindow?: number;
  locale?: string;
  label?: string;
  height?: number;
  /** Extend the inner, named parts of the thread: list, bubble, bubbleMine, text, composer or input. The React Native counterpart of `classNames`. */
  styles?: {
    list?: StyleProp<ViewStyle>;
    bubble?: StyleProp<ViewStyle>;
    bubbleMine?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
    composer?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
  };
}

const time = (value: Date | string | number) => new Date(value).getTime();

export function ChatThread({ participants, currentUserId, messages, defaultMessages = [], typing = [], readBy = {}, onSend, onReact, onRetry, reactions = ["👍", "❤️", "🚀"], placeholder = "Write a message…", composer = true, groupWindow = 5 * 60_000, locale = "en-US", label = "Conversation", height = 360, style, styles: parts, ...props }: ChatThreadProps) {
  const tokens = useTokens();
  const [internal, setInternal] = useState(defaultMessages);
  const [draft, setDraft] = useState("");
  const [picking, setPicking] = useState<string | null>(null);
  const scroller = useRef<ScrollView>(null);
  const list = messages ?? internal;
  const name = (id: string) => participants.find((person) => person.id === id)?.name ?? id;

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (messages === undefined) setInternal((current) => [...current, { id: `local-${current.length}-${Date.now()}`, authorId: currentUserId, text, createdAt: Date.now(), status: "sent" }]);
    await onSend?.({ text });
  }

  function react(id: string, emoji: string) {
    setPicking(null);
    if (messages === undefined) {
      setInternal((current) => current.map((message) => {
        if (message.id !== id) return message;
        const found = message.reactions?.find((entry) => entry.emoji === emoji);
        const next = found ? (found.mine ? (message.reactions ?? []).map((entry) => (entry.emoji === emoji ? { ...entry, count: entry.count - 1, mine: false } : entry)).filter((entry) => entry.count > 0) : (message.reactions ?? []).map((entry) => (entry.emoji === emoji ? { ...entry, count: entry.count + 1, mine: true } : entry))) : [...(message.reactions ?? []), { emoji, count: 1, mine: true }];
        return { ...message, reactions: next };
      }));
    }
    onReact?.(id, emoji);
  }

  return (
    <View {...props} accessibilityLabel={label} style={[{ alignSelf: "stretch", borderWidth: 1, borderRadius: 26, borderColor: tokens.border, backgroundColor: tokens.surface, overflow: "hidden" }, style]}>
      <ScrollView ref={scroller} style={{ height }} contentContainerStyle={[{ padding: metrics.space[4], gap: 4 }, parts?.list]} onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}>
        {list.map((message, index) => {
          const mine = message.authorId === currentUserId;
          const previous = list[index - 1];
          const grouped = previous && previous.authorId === message.authorId && time(message.createdAt) - time(previous.createdAt) < groupWindow;
          const readers = Object.entries(readBy).filter(([id, last]) => id !== currentUserId && last === message.id).map(([id]) => name(id));
          return (
            <View key={message.id} style={{ alignItems: mine ? "flex-end" : "flex-start", marginTop: grouped ? 0 : 8 }}>
              {!grouped ? (
                <View style={[local.meta, mine && { flexDirection: "row-reverse" }]}>
                  {!mine ? <Avatar name={name(message.authorId)} size="sm" src={participants.find((person) => person.id === message.authorId)?.avatar} /> : null}
                  <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{mine ? "You" : name(message.authorId)} · {new Date(message.createdAt).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}</Text>
                </View>
              ) : null}
              <Pressable accessibilityRole="button" accessibilityHint="Press and hold to react" onLongPress={() => setPicking(picking === message.id ? null : message.id)} style={[local.bubble, { backgroundColor: mine ? tokens.foreground : tokens.surfaceMuted }, parts?.bubble, mine && parts?.bubbleMine]}>
                <Text style={[{ color: mine ? tokens.background : tokens.foreground, fontSize: metrics.text.sm }, parts?.text]}>{message.text}</Text>
              </Pressable>
              {picking === message.id ? (
                <View style={[local.picker, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                  {reactions.map((emoji) => (
                    <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`React ${emoji}`} onPress={() => react(message.id, emoji)}>
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {message.reactions?.length ? (
                <View style={local.reactions}>
                  {message.reactions.map((reaction) => (
                    <Pressable key={reaction.emoji} accessibilityRole="button" accessibilityState={{ selected: reaction.mine }} onPress={() => react(message.id, reaction.emoji)} style={[local.reaction, { borderColor: reaction.mine ? tokens.foreground : tokens.border, backgroundColor: tokens.surface }]}>
                      <Text style={{ fontSize: 12 }}>{reaction.emoji} {reaction.count}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {mine && (message.status === "failed" || readers.length) ? (
                message.status === "failed" ? (
                  <Pressable accessibilityRole="button" onPress={() => onRetry?.(message.id)}>
                    <Text style={{ color: tokens.danger, fontSize: metrics.text.xs }}>Failed to send. Retry</Text>
                  </Pressable>
                ) : (
                  <Text style={{ color: tokens.textMuted, fontSize: 11 }}>Seen by {readers.join(", ")}</Text>
                )
              ) : null}
            </View>
          );
        })}
        {typing.length ? <Text style={{ color: tokens.textMuted, fontSize: metrics.text.xs }}>{typing.map(name).join(", ")} {typing.length === 1 ? "is" : "are"} typing…</Text> : null}
      </ScrollView>
      {composer ? (
        <View style={[local.composer, { borderTopColor: tokens.border }, parts?.composer]}>
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={send} placeholder={placeholder} placeholderTextColor={tokens.textMuted} accessibilityLabel={placeholder} returnKeyType="send" style={[local.input, { color: tokens.foreground, backgroundColor: tokens.surfaceMuted }, parts?.input]} />
          <Pressable accessibilityRole="button" accessibilityLabel="Send" disabled={!draft.trim()} onPress={send} style={[local.send, { backgroundColor: tokens.foreground, opacity: draft.trim() ? 1 : 0.4 }]}>
            <ArrowUp size={16} strokeWidth={1.75} color={tokens.background} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  bubble: { maxWidth: "82%", paddingHorizontal: metrics.space[3], paddingVertical: 8, borderRadius: 18 },
  picker: { flexDirection: "row", gap: 12, marginTop: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 999 },
  reactions: { flexDirection: "row", gap: 4, marginTop: 4 },
  reaction: { paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderRadius: 999 },
  composer: { flexDirection: "row", alignItems: "center", gap: metrics.space[2], padding: metrics.space[3], borderTopWidth: 1 },
  input: { flex: 1, minHeight: 40, paddingHorizontal: metrics.space[4], borderRadius: 999, fontSize: metrics.text.sm },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});

export default ChatThread;
