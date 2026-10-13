"use client";

import { useState } from "react";
import { ImageCompare } from "manicat/registry/components/image-compare/image-compare";
import { Carousel } from "manicat/registry/components/carousel/carousel";
import { CardStack } from "manicat/registry/components/card-stack/card-stack";
import { FileDropzone } from "manicat/registry/components/file-dropzone/file-dropzone";
import type { FileDropzoneItem } from "manicat/registry/components/file-dropzone/file-dropzone";
import { SignaturePad } from "manicat/registry/components/signature-pad/signature-pad";
import { ChatThread } from "manicat/registry/components/chat-thread/chat-thread";
import type { ChatMessage, ChatParticipant } from "manicat/registry/components/chat-thread/chat-thread";
import { CommentThread } from "manicat/registry/components/comment-thread/comment-thread";
import type { CommentAuthor, ThreadComment } from "manicat/registry/components/comment-thread/comment-thread";
import { RichTextEditor } from "manicat/registry/components/rich-text-editor/rich-text-editor";

/**
 * @title Before and after
 * Drag the handle to compare an original and its retouched version. Swap the gradients for real images.
 */
export function ImageCompareRetouchExample() {
  return (
    <div className="w-full max-w-xl">
      <ImageCompare
        aspectRatio="16/10"
        labels={["Original", "Retouched"]}
        before={<div className="h-full w-full bg-[linear-gradient(135deg,#1e3a5f,#3b5b8c)]" />}
        after={<div className="h-full w-full bg-[linear-gradient(135deg,#0ea5e9,#22c55e)]" />}
      />
    </div>
  );
}

const stays = [
  { title: "Harbour suites", tone: "from-sky-400 to-blue-600" },
  { title: "Old town lofts", tone: "from-rose-400 to-red-600" },
  { title: "Wine cellar stay", tone: "from-amber-400 to-orange-600" },
  { title: "Hilltop villa", tone: "from-emerald-400 to-green-600" },
];

/**
 * @title Property gallery
 * Drag, swipe or use the arrows; slides snap to a fixed width so the next one peeks in.
 */
export function CarouselGalleryExample() {
  return (
    <div className="w-full max-w-xl">
      <Carousel label="Featured stays" slideSize="72cqw">
        {stays.map((stay) => (
          <div
            key={stay.title}
            className={`flex aspect-[4/3] items-center justify-center rounded-[var(--radius-panel)] bg-gradient-to-br ${stay.tone}`}
          >
            <p className="font-medium text-white">{stay.title}</p>
          </div>
        ))}
      </Carousel>
    </div>
  );
}

const destinations = [
  { name: "Lisbon", tag: "Seven hills, ocean light", emoji: "🌊" },
  { name: "Kyoto", tag: "Temples and quiet lanes", emoji: "⛩️" },
  { name: "Reykjavik", tag: "Lava fields, hot springs", emoji: "🌋" },
];

/**
 * @title Trip shortlist
 * Swipe right to shortlist, left to skip; an empty state offers to start over.
 */
export function CardStackTripsExample() {
  return (
    <CardStack
      items={destinations}
      getKey={(item) => item.name}
      getLabel={(item) => item.name}
      labels={{ left: "Skip", right: "Shortlist" }}
      outcomes={{ left: "skipped", right: "shortlisted" }}
      label="Trip ideas"
      renderCard={(item) => (
        <div className="flex aspect-[5/3] flex-col justify-between p-6">
          <span className="text-4xl">{item.emoji}</span>
          <div>
            <p className="text-lg font-semibold">{item.name}</p>
            <p className="text-sm text-fd-muted-foreground">{item.tag}</p>
          </div>
        </div>
      )}
      renderEmpty={(reset) => (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-fd-muted-foreground">Every idea was decided.</p>
          <button type="button" className="text-sm font-medium" onClick={reset}>
            Start over
          </button>
        </div>
      )}
    />
  );
}

const initialFiles: FileDropzoneItem[] = [
  { id: "f1", name: "logo.svg", size: 12_853, status: "uploaded" },
  { id: "f2", name: "hero.png", size: 402_134, status: "failed", error: "Too large", retryable: true },
];

/**
 * @title Asset uploader
 * Drop files, see each one's status, and retry the ones that failed.
 */
export function FileDropzoneAssetsExample() {
  return (
    <div className="w-full max-w-md">
      <FileDropzone
        label="Add files"
        description="The cover art and its variants live here."
        maxSize={5 * 1024 * 1024}
        defaultItems={initialFiles}
        listPlacement="below"
        note="SVG, PNG or JPG, up to 5 MB."
      />
    </div>
  );
}

/**
 * @title Sign a contract
 * Draw a signature, with the signer's name under the line.
 */
export function SignaturePadContractExample() {
  return (
    <div className="w-full max-w-md">
      <SignaturePad signer="Ada Lovelace" hint="Sign above the line" />
    </div>
  );
}

const participants: ChatParticipant[] = [
  { id: "ada", name: "Ada" },
  { id: "eli", name: "Elia" },
  { id: "me", name: "You" },
];

const HOUR = 3_600_000;
const start = Date.UTC(2026, 8, 9, 9);

const messages: ChatMessage[] = [
  { id: "m1", authorId: "eli", text: "Are the slot-text reels too slow?", createdAt: start - 3 * HOUR },
  {
    id: "m2",
    authorId: "ada",
    text: "I timed them at 0.9s. Feels right for a price change.",
    createdAt: start - 2.6 * HOUR,
    reactions: [{ emoji: "👍", count: 2, mine: true }],
  },
  { id: "m3", authorId: "me", text: "Can the last reel land on the new digit?", createdAt: start - 2.2 * HOUR, status: "sent" },
  { id: "m4", authorId: "ada", text: "Already matched.", createdAt: start - 2 * HOUR },
];

/**
 * @title Design feedback thread
 * A chat with reactions, read receipts and a composer that appends your messages.
 */
export function ChatThreadFeedbackExample() {
  return (
    <div className="w-full max-w-md">
      <ChatThread
        participants={participants}
        currentUserId="me"
        defaultMessages={messages}
        readBy={{ ada: "m4", eli: "m3" }}
        placeholder="Reply in the thread…"
        reactions={["👍", "❤️", "🚀"]}
        label="Design feedback"
      />
    </div>
  );
}

const people: CommentAuthor[] = [
  { id: "eli", name: "Elia Kuratli" },
  { id: "ada", name: "Ada Lovelace" },
  { id: "me", name: "You" },
];

const comments: ThreadComment[] = [
  {
    id: "c1",
    author: people[0],
    body: "The preview pane is 64px short of the section on small screens.",
    createdAt: "2h",
    reactions: [{ emoji: "👍", users: ["ada"] }],
  },
  {
    id: "c2",
    author: people[1],
    body: "Fixed. We also dropped the shadow so the divider reads clearer.",
    createdAt: "1h",
    replies: [{ id: "c3", author: people[2], body: "Looks good on mobile too.", createdAt: "48m" }],
  },
];

/**
 * @title Review comments
 * Threaded comments with replies, reactions and mentions on a design review.
 */
export function CommentThreadReviewExample() {
  return (
    <div className="w-full max-w-md">
      <CommentThread defaultComments={comments} currentUser={people[2]} people={people} title="Hero headline" reactions={["👍", "❤️"]} />
    </div>
  );
}

/**
 * @title Release notes editor
 * Markdown in, markdown out; the “/” hint shows the available blocks and the output is kept in state.
 */
export function RichTextEditorNotesExample() {
  const [markdown, setMarkdown] = useState("");

  return (
    <div className="grid w-full max-w-xl gap-3">
      <RichTextEditor
        defaultMarkdown={"# v2.4.0\n\n- Faster builds\n- New date range picker\n"}
        placeholder="Start typing…"
        blockHint="Type / for a block"
        onChange={(value) => setMarkdown(value.markdown)}
      />
      <p className="text-xs text-fd-muted-foreground">{markdown.length} characters of markdown</p>
    </div>
  );
}
