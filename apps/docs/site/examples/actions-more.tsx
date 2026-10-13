"use client";

import { useState } from "react";
import { Archive, MoreHorizontal, Share2, Star, Trash2, Undo2 } from "lucide-react";
import { ActionButton } from "manicat/registry/components/action-button/action-button";
import { SplitButton } from "manicat/registry/components/split-button/split-button";
import { ButtonGroup } from "manicat/registry/components/button-group/button-group";
import { FloatingButtonGroup } from "manicat/registry/components/floating-button-group/floating-button-group";
import { ExpandingButtonGroup } from "manicat/registry/components/expanding-button-group/expanding-button-group";
import { CopyButton } from "manicat/registry/components/copy-button/copy-button";
import { ConfirmMorph } from "manicat/registry/components/confirm-morph/confirm-morph";
import { HoldToConfirm } from "manicat/registry/components/hold-to-confirm/hold-to-confirm";
import { SwipeActions, SwipeActionsRow } from "manicat/registry/components/swipe-actions/swipe-actions";
import { DropdownMenu } from "manicat/registry/components/dropdown-menu/dropdown-menu";
import { ContextMenu, contextMenuExampleItems } from "manicat/registry/components/context-menu/context-menu";
import { UserMenu } from "manicat/registry/components/user-menu/user-menu";
import { ThemeSwitch } from "manicat/registry/components/theme-switch/theme-switch";

const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/**
 * @title Publish a post
 * An async button that shows progress and success on its own while the promise runs.
 */
export function ActionButtonPublishExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActionButton label="Publish" onAction={() => wait(900)} />
      <ActionButton label="Archive" onAction={() => wait(1400)} />
    </div>
  );
}

/**
 * @title Publish options
 * The main action stays one click; the menu holds the variants.
 */
export function SplitButtonPublishExample() {
  const [last, setLast] = useState("Nothing published yet");

  return (
    <div className="grid justify-items-start gap-3">
      <SplitButton
        label="Publish"
        onClick={() => setLast("Published now")}
        actions={[
          { label: "Publish now", onSelect: () => setLast("Published now") },
          { label: "Schedule for later", onSelect: () => setLast("Scheduled for tomorrow 9:00") },
          { label: "Publish to a copy", onSelect: () => setLast("Published to a copy") },
        ]}
      />
      <p className="text-sm text-fd-muted-foreground">{last}</p>
    </div>
  );
}

/**
 * @title Document toolbar
 * Primary actions inline and the rest behind a “more” menu.
 */
export function ButtonGroupToolbarExample() {
  return (
    <ButtonGroup
      label="Document actions"
      items={[
        { id: "copy", label: "Copy link", icon: <Share2 size={16} />, onSelect: () => {} },
        { id: "star", label: "Star", icon: <Star size={16} />, onSelect: () => {} },
        { id: "delete", label: "Delete", icon: <Trash2 size={16} />, onSelect: () => {} },
      ]}
      menu={{ label: "More actions", items: [{ id: "move", label: "Move to folder" }, { id: "archive", label: "Archive" }] }}
    />
  );
}

/**
 * @title Whiteboard tools
 * A floating toolbar with a separator and a shortcut hint on the last tool.
 */
export function FloatingButtonGroupBoardExample() {
  return (
    <FloatingButtonGroup
      label="Board actions"
      items={[
        { id: "select", label: "Select" },
        { id: "draw", label: "Draw" },
        { id: "share", label: "Share" },
        { type: "separator" },
        { id: "undo", label: "Undo", icon: <Undo2 size={16} />, shortcut: "⌘Z" },
      ]}
    />
  );
}

/**
 * @title Message actions
 * Icon buttons that expand to reveal their label; the destructive one uses the danger tone.
 */
export function ExpandingButtonGroupMessageExample() {
  return (
    <ExpandingButtonGroup
      label="Message actions"
      items={[
        { id: "archive", label: "Archive", icon: <Archive size={16} />, doneLabel: "Archived" },
        { id: "delete", label: "Delete", icon: <Trash2 size={16} />, tone: "danger" },
      ]}
    />
  );
}

/**
 * @title Copy install command
 * A copy button next to the command it copies.
 */
export function CopyButtonCommandExample() {
  const command = "npx shadcn@latest add https://manicat.dev/r/button.json";

  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-[var(--radius-control)] border border-fd-border bg-fd-card py-2 pl-4 pr-2">
      <code className="truncate font-mono text-sm text-fd-foreground">{command}</code>
      <CopyButton value={command} label="Copy install command" />
    </div>
  );
}

/**
 * @title Delete with undo
 * The button morphs into a confirmation, runs the delete, then offers an undo.
 */
export function ConfirmMorphDeleteExample() {
  return (
    <ConfirmMorph
      label="Delete"
      icon={<Trash2 size={16} />}
      tone="danger"
      onConfirm={() => wait(1200)}
      onUndo={() => wait(600)}
    />
  );
}

/**
 * @title Hold to delete
 * A destructive action that needs an intentional press, with the result shown next to it.
 */
export function HoldToConfirmDeleteExample() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <HoldToConfirm label="Hold to delete account" onConfirm={() => setConfirmed(true)} />
      {confirmed ? <span className="text-sm text-fd-muted-foreground">Account scheduled for deletion.</span> : null}
    </div>
  );
}

const threads = [
  { name: "Ada Lovelace", subject: "Analytical engine notes" },
  { name: "Grace Hopper", subject: "Compiler design" },
];

/**
 * @title Inbox rows
 * Swipe a row to reveal pin, archive and delete, like a mail app.
 */
export function SwipeActionsInboxExample() {
  return (
    <div className="w-full max-w-md">
      <SwipeActions label="Message actions">
        {threads.map((thread) => (
          <SwipeActionsRow
            key={thread.name}
            label={thread.name}
            leading={[{ label: "Pin", icon: <Star size={16} />, onSelect: () => {}, keepRow: true }]}
            trailing={[
              { label: "Archive", icon: <Archive size={16} />, onSelect: () => {} },
              { label: "Delete", icon: <Trash2 size={16} />, tone: "danger", onSelect: () => {} },
            ]}
          >
            <div className="flex items-center gap-3 py-2 text-sm">
              <span className="font-medium">{thread.name}</span>
              <span className="text-fd-muted-foreground">{thread.subject}</span>
            </div>
          </SwipeActionsRow>
        ))}
      </SwipeActions>
    </div>
  );
}

/**
 * @title Row actions
 * A kebab menu with a separated destructive item.
 */
export function DropdownMenuRowExample() {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-between gap-6 rounded-[var(--radius-control)] border border-fd-border bg-fd-card py-2 pl-4 pr-2">
      <span className="text-sm text-fd-foreground">quarterly-report.pdf</span>
      <DropdownMenu
        label="Row actions"
        icon={<MoreHorizontal size={16} />}
        items={[
          { label: "Rename", onSelect: () => setOpened("Rename") },
          { label: "Duplicate", onSelect: () => setOpened("Duplicate") },
          { label: "Move to archive", separatorBefore: true },
          { label: "Delete", destructive: true, onSelect: () => setOpened("Delete") },
        ]}
      />
      {opened ? <span className="text-xs text-fd-muted-foreground">{opened}</span> : null}
    </div>
  );
}

/**
 * @title File context menu
 * Right-click (or press the menu key) anywhere on the card.
 */
export function ContextMenuFileExample() {
  return (
    <div className="w-full max-w-sm">
      <ContextMenu items={contextMenuExampleItems} label="File actions">
        <div className="flex w-full flex-col gap-2 rounded-xl border border-fd-border p-4 text-sm">
          <span className="font-medium">report-q3.pdf</span>
          <span className="text-fd-muted-foreground">Right click, or press the menu key.</span>
        </div>
      </ContextMenu>
    </div>
  );
}

/**
 * @title Account menu
 * The avatar menu in an app header with the plan, shortcuts and sign out.
 */
export function UserMenuAccountExample() {
  return (
    <UserMenu
      user={{ name: "Ada Lovelace", email: "ada@example.com", plan: "Pro" }}
      items={[{ label: "Settings" }, { label: "Keyboard shortcuts", keys: ["⌘", "/"] }, { label: "Sign out" }]}
      onSignOut={() => {}}
    />
  );
}

/**
 * @title Header theme toggle
 * Keep the theme in state (or in next-themes) and pass it in; the switch animates the change.
 */
export function ThemeSwitchHeaderExample() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return <ThemeSwitch theme={theme} onThemeChange={setTheme} />;
}

/**
 * @title Eclipse
 * The sun is eclipsed by the moon as the theme changes.
 */
export function ThemeSwitchEclipseHeaderExample() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  return <ThemeSwitch variant="eclipse" theme={theme} onThemeChange={setTheme} />;
}

/**
 * @title Split
 * A split-circle toggle for compact toolbars.
 */
export function ThemeSwitchSplitHeaderExample() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return <ThemeSwitch variant="split" theme={theme} onThemeChange={setTheme} />;
}

/**
 * @title Rise
 * The new theme rises from the bottom of the control.
 */
export function ThemeSwitchRiseHeaderExample() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return <ThemeSwitch variant="rise" theme={theme} onThemeChange={setTheme} />;
}
