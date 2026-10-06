"use client";

import { useState } from "react";
import { MoreHorizontal, Share2, Star, Trash2, Undo2 } from "lucide-react";
import { Button } from "arc/registry/components/button/button";
import { ActionButton } from "arc/registry/components/action-button/action-button";
import { SplitButton } from "arc/registry/components/split-button/split-button";
import { ButtonGroup } from "arc/registry/components/button-group/button-group";
import { FloatingButtonGroup } from "arc/registry/components/floating-button-group/floating-button-group";
import { ExpandingButtonGroup } from "arc/registry/components/expanding-button-group/expanding-button-group";
import { CopyButton } from "arc/registry/components/copy-button/copy-button";
import { ConfirmMorph } from "arc/registry/components/confirm-morph/confirm-morph";
import { HoldToConfirm } from "arc/registry/components/hold-to-confirm/hold-to-confirm";
import { SwipeActions, SwipeActionsRow } from "arc/registry/components/swipe-actions/swipe-actions";
import { DropdownMenu } from "arc/registry/components/dropdown-menu/dropdown-menu";
import { ContextMenu, contextMenuExampleItems } from "arc/registry/components/context-menu/context-menu";
import { UserMenu } from "arc/registry/components/user-menu/user-menu";
import { ThemeSwitch } from "arc/registry/components/theme-switch/theme-switch";
import { useTheme } from "fumadocs-ui/provider/base";

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Save changes</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Learn more</Button>
      <Button variant="danger">Delete project</Button>
    </div>
  );
}

export function ButtonLoadingDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button loading={loading} onClick={() => setLoading(true)}>
        Publish
      </Button>
      <Button variant="secondary" onClick={() => setLoading(false)}>
        Stop
      </Button>
    </div>
  );
}

export function ButtonSizesDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="sm" variant="secondary">
        With icon <Share2 size={16} />
      </Button>
    </div>
  );
}

export function ActionButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ActionButton label="Publish" onAction={async () => { await new Promise((done) => setTimeout(done, 900)); }} />
      <ActionButton label="Archive" onAction={async () => { await new Promise((done) => setTimeout(done, 1400)); }} />
    </div>
  );
}

export function SplitButtonDemo() {
  const [count, setCount] = useState(0);

  return (
    <SplitButton
      label={`Publish (${count})`}
      onClick={() => setCount((value) => value + 1)}
      actions={[{ label: "Publish now" }, { label: "Schedule for later" }, { label: "Publish to a copy" }]}
    />
  );
}

export function ButtonGroupDemo() {
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

export function FloatingButtonGroupDemo() {
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

export function ExpandingButtonGroupDemo() {
  return (
    <ExpandingButtonGroup
      label="Message actions"
      items={[
        { id: "archive", label: "Archive", icon: <Star size={16} />, doneLabel: "Archived" },
        { id: "delete", label: "Delete", icon: <Trash2 size={16} />, tone: "danger" },
      ]}
    />
  );
}

export function CopyButtonDemo() {
  return <CopyButton value="npx shadcn@latest add https://uiarc.dev/r/button.json" label="Copy install command" />;
}

export function ConfirmMorphDemo() {
  return <ConfirmMorph label="Delete" icon={<Trash2 size={16} />} tone="danger" onConfirm={async () => { await new Promise((done) => setTimeout(done, 1200)); }} onUndo={async () => { await new Promise((done) => setTimeout(done, 600)); }} />;
}

export function HoldToConfirmDemo() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <HoldToConfirm label="Hold to delete" onConfirm={() => setConfirmed(true)} />
      {confirmed ? <span className="text-sm text-fd-muted-foreground">Deleted.</span> : null}
    </div>
  );
}

export function SwipeActionsDemo() {
  return (
    <SwipeActions label="Message actions">
      <SwipeActionsRow
        label="Ada Lovelace"
        leading={[{ label: "Pin", icon: <Star size={16} />, onSelect: () => {}, keepRow: true }]}
        trailing={[
          { label: "Archive", icon: <Star size={16} />, onSelect: () => {} },
          { label: "Delete", icon: <Trash2 size={16} />, tone: "danger", onSelect: () => {} },
        ]}
      >
        <div className="flex items-center gap-3 py-2 text-sm">
          <span className="font-medium">Ada Lovelace</span>
          <span className="text-fd-muted-foreground">Analytical engine notes</span>
        </div>
      </SwipeActionsRow>
      <SwipeActionsRow
        label="Grace Hopper"
        trailing={[{ label: "Delete", icon: <Trash2 size={16} />, tone: "danger", onSelect: () => {} }]}
      >
        <div className="flex items-center gap-3 py-2 text-sm">
          <span className="font-medium">Grace Hopper</span>
          <span className="text-fd-muted-foreground">Compiler design</span>
        </div>
      </SwipeActionsRow>
    </SwipeActions>
  );
}

export function DropdownMenuDemo() {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-3">
      <DropdownMenu
        label="Row actions"
        icon={<MoreHorizontal size={16} />}
        items={[
          { label: "Rename", onSelect: () => setOpened("Rename") },
          { label: "Duplicate" },
          { label: "Move to archive", separatorBefore: true },
          { label: "Delete", destructive: true, onSelect: () => setOpened("Delete") },
        ]}
      />
      {opened ? <span className="text-sm text-fd-muted-foreground">Selected: {opened}</span> : null}
    </div>
  );
}

export function ContextMenuDemo() {
  return (
    <ContextMenu items={contextMenuExampleItems} label="File actions">
      <div className="flex w-full flex-col gap-2 rounded-xl border border-fd-border p-4 text-sm">
        <span className="font-medium">report-q3.pdf</span>
        <span className="text-fd-muted-foreground">Right click, or press the menu key.</span>
      </div>
    </ContextMenu>
  );
}

export function UserMenuDemo() {
  return (
    <UserMenu
      user={{ name: "Elia Kuratli", email: "hello@uiarc.dev", plan: "Arc Pro" }}
      items={[{ label: "Settings" }, { label: "Keyboard shortcuts", keys: ["⌘", "/"] }, { label: "Sign out" }]}
      onSignOut={() => {}}
    />
  );
}

export function ThemeSwitchDemo() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ThemeSwitch theme={resolvedTheme === "dark" ? "dark" : "light"} onThemeChange={(next) => setTheme(next)} />
    </div>
  );
}

export function ThemeSwitchEclipseDemo() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <ThemeSwitch
      variant="eclipse"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={(next) => setTheme(next)}
    />
  );
}

export function ThemeSwitchSplitDemo() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <ThemeSwitch
      variant="split"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={(next) => setTheme(next)}
    />
  );
}

export function ThemeSwitchRiseDemo() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <ThemeSwitch
      variant="rise"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={(next) => setTheme(next)}
    />
  );
}