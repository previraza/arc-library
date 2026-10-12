"use client";

import { ChatThread } from "manicat/registry/components/chat-thread/chat-thread";
import { CommentThread } from "manicat/registry/components/comment-thread/comment-thread";
import { RichTextEditor } from "manicat/registry/components/rich-text-editor/rich-text-editor";

import type { ChatMessage, ChatParticipant } from "manicat/registry/components/chat-thread/chat-thread";
import type { CommentAuthor, ThreadComment } from "manicat/registry/components/comment-thread/comment-thread";

const chatParticipants: ChatParticipant[] = [
  { id: "ada", name: "Ada" },
  { id: "eli", name: "Elia" },
  { id: "me", name: "You" },
];

const HOUR = 3_600_000;
const threadTime = Date.UTC(2026, 8, 9, 9);

const threadMessages: ChatMessage[] = [
  { id: "m1", authorId: "eli", text: "Do you think the slot-text reels are too slow?", createdAt: threadTime - 3 * HOUR },
  {
    id: "m2",
    authorId: "ada",
    text: "I timed them at 0.9s. Feels right for a price change.",
    createdAt: threadTime - 2.6 * HOUR,
    reactions: [{ emoji: "👍", count: 2, mine: true }],
  },
  { id: "m3", authorId: "me", text: "Can we make the last reel land on the new digit?", createdAt: threadTime - 2.2 * HOUR, status: "sent" },
  { id: "m4", authorId: "ada", text: "Already matched. End alignment grows on the left for 999 → 1,000.", createdAt: threadTime - 2 * HOUR },
  { id: "m5", authorId: "eli", text: "Let's ship it and watch the demos.", createdAt: threadTime - HOUR },
];

export function ChatThreadDemo() {
  return (
    <ChatThread
      participants={chatParticipants}
      currentUserId="me"
      defaultMessages={threadMessages}
      readBy={{ ada: "m4", eli: "m5" }}
      placeholder="Reply in the thread…"
      reactions={["👍", "❤️", "🚀"]}
      label="Design feedback"
    />
  );
}

const commentPeople: CommentAuthor[] = [
  { id: "eli", name: "Elia Kuratli" },
  { id: "ada", name: "Ada Lovelace" },
  { id: "me", name: "You" },
];

const threadComments: ThreadComment[] = [
  {
    id: "c1",
    author: commentPeople[0],
    body: "The preview pane is 64px short of the section on small screens.",
    createdAt: "2h",
    reactions: [{ emoji: "👍", users: ["ada"] }],
  },
  {
    id: "c2",
    author: commentPeople[1],
    body: "Fixed. We also dropped the shadow so the divider reads clearer.",
    createdAt: "1h",
    replies: [
      { id: "c3", author: commentPeople[2], body: "Great — the portal to body sorts the containing block too.", createdAt: "48m" },
      { id: "c4", author: commentPeople[0], body: "Thanks for catching that.", createdAt: "26m", deleted: true },
    ],
  },
];

export function CommentThreadDemo() {
  return (
    <CommentThread
      defaultComments={threadComments}
      currentUser={commentPeople[2]}
      people={commentPeople}
      title="Hero headline"
      reactions={["👍", "❤️"]}
    />
  );
}

export function RichTextEditorDemo() {
  return (
    <RichTextEditor
      defaultMarkdown={`# Rich text, out of the box

## Type, then press **Enter** for a new block

- An unordered list
- With a *second* item

> "A quote block keeps the pace of a paragraph."
`}
      placeholder="Start typing…"
      blockHint="Type / for a block"
    />
  );
}