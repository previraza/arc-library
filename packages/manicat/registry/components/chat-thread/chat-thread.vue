<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import Avatar from "@/registry/components/avatar/avatar.vue";

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

const props = withDefaults(
  defineProps<{
    participants: ChatParticipant[];
    currentUserId: string;
    typing?: string[];
    /** For each participant id, the id of the last message they have read. */
    readBy?: Record<string, string>;
    reactions?: string[];
    placeholder?: string;
    composer?: boolean;
    /** Messages within this many milliseconds from the same author share one bubble group. */
    groupWindow?: number;
    locale?: string;
    label?: string;
    height?: number | string;
    /** Extend the inner, named parts of the thread: list, bubble, text, composer or input. */
    classNames?: { list?: string; bubble?: string; text?: string; composer?: string; input?: string };
  }>(),
  { typing: () => [], readBy: () => ({}), reactions: () => ["👍", "❤️", "🚀"], placeholder: "Write a message…", composer: true, groupWindow: 5 * 60_000, locale: "en-US", label: "Conversation", height: "22rem" },
);

const emit = defineEmits<{ send: [draft: { text: string }]; react: [messageId: string, emoji: string]; retry: [messageId: string] }>();
/** `v-model` binds the messages; sending and reacting update it. */
const messages = defineModel<ChatMessage[]>({ default: () => [] });
const draft = ref("");
const picking = ref<string | null>(null);
const list = ref<HTMLElement>();

const time = (value: Date | string | number) => new Date(value).getTime();
const name = (id: string) => props.participants.find((person) => person.id === id)?.name ?? id;
const grouped = (index: number) => {
  const previous = messages.value[index - 1];
  return Boolean(previous && previous.authorId === messages.value[index].authorId && time(messages.value[index].createdAt) - time(previous.createdAt) < props.groupWindow);
};
const readers = (id: string) => Object.entries(props.readBy).filter(([who, last]) => who !== props.currentUserId && last === id).map(([who]) => name(who));

function send() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = "";
  messages.value = [...messages.value, { id: `local-${messages.value.length}-${Date.now()}`, authorId: props.currentUserId, text, createdAt: Date.now(), status: "sent" }];
  emit("send", { text });
}

function react(id: string, emoji: string) {
  picking.value = null;
  messages.value = messages.value.map((message) => {
    if (message.id !== id) return message;
    const found = message.reactions?.find((entry) => entry.emoji === emoji);
    const next = found
      ? (message.reactions ?? []).map((entry) => (entry.emoji === emoji ? { ...entry, count: entry.count + (found.mine ? -1 : 1), mine: !found.mine } : entry)).filter((entry) => entry.count > 0)
      : [...(message.reactions ?? []), { emoji, count: 1, mine: true }];
    return { ...message, reactions: next };
  });
  emit("react", id, emoji);
}

const toEnd = () => nextTick(() => list.value && (list.value.scrollTop = list.value.scrollHeight));
watch(() => messages.value.length, toEnd);
onMounted(toEnd);
</script>

<template>
  <section class="mc-chat" :aria-label="label">
    <div ref="list" :class="['mc-chat__list', classNames?.list]" role="log" aria-live="polite" :style="{ height: typeof height === 'number' ? `${height}px` : height }">
      <div v-for="(message, index) in messages" :key="message.id" :class="['mc-chat__message', { 'mc-chat__message--mine': message.authorId === currentUserId, 'mc-chat__message--grouped': grouped(index) }]">
        <div v-if="!grouped(index)" class="mc-chat__meta">
          <Avatar v-if="message.authorId !== currentUserId" :name="name(message.authorId)" size="sm" :src="participants.find((person) => person.id === message.authorId)?.avatar" />
          <span>{{ message.authorId === currentUserId ? "You" : name(message.authorId) }} · {{ new Date(message.createdAt).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }) }}</span>
        </div>
        <button type="button" :class="['mc-chat__bubble', classNames?.bubble]" aria-haspopup="true" :aria-expanded="picking === message.id" @click="picking = picking === message.id ? null : message.id"><span :class="classNames?.text">{{ message.text }}</span></button>
        <div v-if="picking === message.id" class="mc-chat__picker" role="menu"><button v-for="emoji in reactions" :key="emoji" type="button" role="menuitem" :aria-label="`React ${emoji}`" @click="react(message.id, emoji)">{{ emoji }}</button></div>
        <div v-if="message.reactions?.length" class="mc-chat__reactions"><button v-for="reaction in message.reactions" :key="reaction.emoji" type="button" :aria-pressed="reaction.mine" @click="react(message.id, reaction.emoji)">{{ reaction.emoji }} {{ reaction.count }}</button></div>
        <button v-if="message.status === 'failed'" type="button" class="mc-chat__failed" @click="emit('retry', message.id)">Failed to send. Retry</button>
        <span v-else-if="message.authorId === currentUserId && readers(message.id).length" class="mc-chat__seen">Seen by {{ readers(message.id).join(", ") }}</span>
      </div>
      <p v-if="typing.length" class="mc-chat__typing">{{ typing.map(name).join(", ") }} {{ typing.length === 1 ? "is" : "are" }} typing…</p>
    </div>
    <form v-if="composer" :class="['mc-chat__composer', classNames?.composer]" @submit.prevent="send">
      <input v-model="draft" :class="['mc-chat__input', classNames?.input]" :placeholder="placeholder" :aria-label="placeholder" autocomplete="off" />
      <button type="submit" class="mc-chat__send" aria-label="Send" :disabled="!draft.trim()">↑</button>
    </form>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-chat { display: grid; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
.mc-chat__list { display: flex; flex-direction: column; gap: 4px; padding: var(--space-4); overflow: auto; }
.mc-chat__message { display: flex; flex-direction: column; align-items: flex-start; margin-top: 8px; } .mc-chat__message--mine { align-items: flex-end; } .mc-chat__message--grouped { margin-top: 0; }
.mc-chat__meta { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: var(--text-muted); font-size: var(--text-xs); } .mc-chat__message--mine .mc-chat__meta { flex-direction: row-reverse; }
.mc-chat__bubble { max-width: 82%; padding: 8px var(--space-3); border: 0; border-radius: 18px; background: var(--surface-muted); color: var(--foreground); font: inherit; font-size: var(--text-sm); text-align: left; cursor: pointer; }
.mc-chat__message--mine .mc-chat__bubble { background: var(--foreground); color: var(--background); }
.mc-chat__picker { display: flex; gap: 8px; margin-top: 4px; padding: 4px 10px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); box-shadow: var(--shadow-raised); } .mc-chat__picker button { border: 0; background: transparent; font-size: 18px; cursor: pointer; }
.mc-chat__reactions { display: flex; gap: 4px; margin-top: 4px; } .mc-chat__reactions button { padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); font: inherit; font-size: 12px; cursor: pointer; } .mc-chat__reactions button[aria-pressed="true"] { border-color: var(--foreground); }
.mc-chat__failed { padding: 0; border: 0; background: transparent; color: var(--danger); font: inherit; font-size: var(--text-xs); cursor: pointer; } .mc-chat__seen { color: var(--text-muted); font-size: 11px; } .mc-chat__typing { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-chat__composer { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3); border-top: 1px solid var(--border); }
.mc-chat__input { flex: 1; min-height: 40px; padding: 0 var(--space-4); border: 0; border-radius: var(--radius-pill); outline: 0; background: var(--surface-muted); color: var(--foreground); font: inherit; font-size: var(--text-sm); }
.mc-chat__send { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--foreground); color: var(--background); font: inherit; font-size: 16px; cursor: pointer; } .mc-chat__send:disabled { opacity: .4; cursor: not-allowed; }
</style>
