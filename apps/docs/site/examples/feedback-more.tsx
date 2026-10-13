"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "manicat/registry/components/button/button";
import Toast from "manicat/registry/components/toast/toast";
import { ToastStack, ToastStackProvider, useToastStack } from "manicat/registry/components/toast-stack/toast-stack";
import { AnnouncementBar } from "manicat/registry/components/announcement-bar/announcement-bar";
import { Skeleton } from "manicat/registry/components/skeleton/skeleton";
import { Stepper } from "manicat/registry/components/stepper/stepper";
import { UsageMeter } from "manicat/registry/components/usage-meter/usage-meter";
import { Avatar } from "manicat/registry/components/avatar/avatar";
import { AvatarGroup } from "manicat/registry/components/avatar-group/avatar-group";
import { Card } from "manicat/registry/components/card/card";
import { MetricCard } from "manicat/registry/components/metric-card/metric-card";
import { EmptyState } from "manicat/registry/components/empty-state/empty-state";
import { Badge } from "manicat/registry/components/badge/badge";
import { ScrollArea } from "manicat/registry/components/scroll-area/scroll-area";
import { ExpandableCard } from "manicat/registry/components/expandable-card/expandable-card";
import { ResizablePanel, ResizablePanels } from "manicat/registry/components/resizable-panels/resizable-panels";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "manicat/registry/components/drawer/drawer";
import { BottomSheet, BottomSheetClose } from "manicat/registry/components/bottom-sheet/bottom-sheet";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "manicat/registry/components/popover/popover";
import { HoverCard, HoverCardProfile } from "manicat/registry/components/hover-card/hover-card";
import { Tooltip } from "manicat/registry/components/tooltip/tooltip";

/**
 * @title Copy confirmation
 * A single toast confirming an action the user just took.
 */
export function ToastCopiedExample() {
  const [open, setOpen] = useState(true);

  return (
    <ToastStackProvider>
      <div className="grid justify-items-center gap-3">
        <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide toast" : "Copy link"}
        </Button>
        <Toast title="Link copied" description="Anyone with the link can view this project." open={open} onOpenChange={setOpen} />
      </div>
    </ToastStackProvider>
  );
}

function ToastTriggers() {
  const { toast, dismiss } = useToastStack();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={() => toast({ title: "Changes saved", type: "success" })}>Save</Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Conversation deleted", type: "info", action: { label: "Undo", onClick: () => dismiss() } })}
      >
        Delete with undo
      </Button>
      <ToastStack contained position="bottom-center" />
    </div>
  );
}

/**
 * @title Toasts from anywhere
 * Mount the provider once, then call toast() from any handler; actions like Undo live inside the toast.
 */
export function ToastStackActionsExample() {
  return (
    <ToastStackProvider>
      <ToastTriggers />
    </ToastStackProvider>
  );
}

/**
 * @title Product announcements
 * A rotating banner at the top of the site with a call to action per message.
 */
export function AnnouncementBarProductExample() {
  return (
    <div className="w-full">
      <AnnouncementBar
        messages={[
          { id: "pro", message: "Manicat Pro adds 43 motion components.", action: { label: "See Pro", onClick: () => {} } },
          { id: "cli", message: "Every item installs with the shadcn CLI.", action: { label: "Installation", onClick: () => {} } },
        ]}
      />
    </div>
  );
}

/**
 * @title Loading a profile
 * The placeholder keeps the final layout, then crossfades into the real content.
 */
export function SkeletonProfileExample() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="grid w-full max-w-md gap-4">
      <Button size="sm" variant="secondary" onClick={() => setLoading((value) => !value)}>
        {loading ? "Finish loading" : "Load again"}
      </Button>
      <Skeleton loading={loading} avatar lines={3} label="Loading profile">
        <div className="flex items-start gap-3">
          <Avatar name="Ada Lovelace" />
          <div>
            <p className="text-sm font-medium text-fd-foreground">Ada Lovelace</p>
            <p className="text-sm text-fd-muted-foreground">Wrote the first program. Currently leading the analytics team.</p>
          </div>
        </div>
      </Skeleton>
    </div>
  );
}

const onboarding = [
  { id: "plan", label: "Plan", description: "Choose a template and a plan." },
  { id: "connect", label: "Connect", description: "Link your GitHub repository." },
  { id: "deploy", label: "Deploy", description: "Ship the first version." },
];

/**
 * @title Onboarding flow
 * A step indicator driven by Back and Next, with completed steps clickable.
 */
export function StepperOnboardingExample() {
  const [current, setCurrent] = useState(1);

  return (
    <div className="grid w-full max-w-2xl gap-4">
      <Stepper steps={onboarding} current={current} onStepSelect={setCurrent} details="all" />
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setCurrent((value) => Math.max(0, value - 1))}>
          Back
        </Button>
        <Button size="sm" onClick={() => setCurrent((value) => Math.min(onboarding.length, value + 1))}>
          Next
        </Button>
      </div>
    </div>
  );
}

/**
 * @title Storage quota
 * A segmented meter that shows what fills the quota, with a button to simulate growth.
 */
export function UsageMeterStorageExample() {
  const [used, setUsed] = useState(64);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <UsageMeter
        label="Workspace storage"
        limit={100}
        unit="GB"
        segments={[
          { id: "db", label: "Database", value: used * 0.5 },
          { id: "media", label: "Media", value: used * 0.4 },
          { id: "logs", label: "Logs", value: used * 0.1 },
        ]}
      />
      <Button size="sm" variant="secondary" onClick={() => setUsed((value) => (value > 90 ? 20 : value + 20))}>
        Add 20 GB
      </Button>
    </div>
  );
}

/**
 * @title Presence
 * Sizes and online/offline status as they appear in a member list.
 */
export function AvatarPresenceExample() {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="Elia Kuratli" size="sm" />
      <Avatar name="Ada Lovelace" status="online" />
      <Avatar name="Grace Hopper" size="lg" />
      <Avatar name="Alan Turing" size="xl" status="offline" />
    </div>
  );
}

/**
 * @title Project members
 * Overlapping avatars that collapse into a +N when the list is long.
 */
export function AvatarGroupMembersExample() {
  return (
    <div className="flex items-center gap-3">
      <AvatarGroup
        members={[
          { name: "Ada Lovelace", src: "https://i.pravatar.cc/96?img=47" },
          { name: "Grace Hopper", src: "https://i.pravatar.cc/96?img=32" },
          { name: "Alan Turing", src: "https://i.pravatar.cc/96?img=13" },
          { name: "Katherine Johnson", src: "https://i.pravatar.cc/96?img=45" },
          { name: "Barbara Liskov", src: "https://i.pravatar.cc/96?img=44" },
        ]}
      />
      <span className="text-sm text-fd-muted-foreground">5 members</span>
    </div>
  );
}

/**
 * @title Roadmap card
 * A card with a title, a status line and any content inside.
 */
export function CardRoadmapExample() {
  return (
    <div className="w-full max-w-md">
      <Card title="Quiet motion" description="Springs for anything that moves on screen." status="Updated 2 hours ago">
        <div className="flex gap-2">
          <Badge tone="success">Shipped</Badge>
          <Badge tone="info">12 components</Badge>
        </div>
      </Card>
    </div>
  );
}

/**
 * @title Revenue metric
 * A headline number with context and change, updating live.
 */
export function MetricCardRevenueExample() {
  const [revenue, setRevenue] = useState(48250);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <MetricCard label="Monthly revenue" value={revenue} suffix=" USD" context="vs 41,900 last month" change="+15.2%" />
      <Button size="sm" variant="secondary" onClick={() => setRevenue((value) => value + 1250)}>
        Add 1,250
      </Button>
    </div>
  );
}

/**
 * @title First-run projects
 * What a list shows before anything exists: an explanation and the one action that fixes it.
 */
export function EmptyStateProjectsExample() {
  return (
    <EmptyState
      title="No projects yet"
      description="Create your first project to see deployments, domains and usage here."
      icon={<Badge tone="info">New</Badge>}
      action={<Button>Create project</Button>}
    />
  );
}

/**
 * @title Activity log
 * A bounded list with an overlay scrollbar that only shows while scrolling.
 */
export function ScrollAreaLogExample() {
  return (
    <ScrollArea maxHeight={180} className="w-full max-w-sm rounded-[var(--radius-panel)] border border-fd-border p-4">
      <div className="flex flex-col gap-3 text-sm">
        {Array.from({ length: 12 }, (_, index) => (
          <p key={index} className="text-fd-muted-foreground">
            09:{String(10 + index * 3).padStart(2, "0")} · Deployment #{140 + index} finished
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}

/**
 * @title Plan details
 * The card opens into a larger view in place, so the page around it never moves.
 */
export function ExpandableCardPlanExample() {
  return (
    <div className="w-full max-w-md">
      <ExpandableCard title="Quarterly plan" description="Three tracks, reviewed every Friday.">
        <ul className="grid gap-2 text-sm text-fd-muted-foreground">
          <li>Design system: tokens and dark mode</li>
          <li>Docs: examples for every component</li>
          <li>Registry: framework ports</li>
        </ul>
      </ExpandableCard>
    </div>
  );
}

/**
 * @title Editor split
 * Two resizable panes, like a file tree next to an editor. Drag the divider or use the arrow keys.
 */
export function ResizablePanelsEditorExample() {
  return (
    <ResizablePanels label="Editor split" className="h-48 w-full max-w-2xl rounded-[var(--radius-panel)] border border-fd-border">
      <ResizablePanel id="files" label="Files" defaultSize={35}>
        <div className="p-4 text-sm text-fd-muted-foreground">app/ · lib/ · site/</div>
      </ResizablePanel>
      <ResizablePanel id="editor" label="Editor" defaultSize={65}>
        <div className="p-4 font-mono text-sm text-fd-foreground">export default function Page() {"{ … }"}</div>
      </ResizablePanel>
    </ResizablePanels>
  );
}

/**
 * @title Filter drawer
 * A side panel for secondary controls that keeps the list in view.
 */
export function DrawerFiltersExample() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary">Filters</Button>
      </DrawerTrigger>
      <DrawerContent title="Filters" description="Narrow the list without leaving the page.">
        <p className="text-sm text-fd-muted-foreground">Status, owner and date range go here.</p>
        <DrawerClose>
          <Button>Show results</Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * @title Share sheet
 * On small screens the sheet rises from the bottom edge.
 */
export function BottomSheetShareExample() {
  return (
    <div className="w-full max-w-xs">
      <BottomSheet
        title="Share this project"
        description="Anyone with the link can view."
        trigger={
          <Button variant="secondary" className="w-full">
            Share
          </Button>
        }
      >
        <BottomSheetClose>
          <Button className="w-full">Copy link</Button>
        </BottomSheetClose>
      </BottomSheet>
    </div>
  );
}

/**
 * @title Column settings
 * A small panel anchored to its trigger, closable from inside.
 */
export function PopoverColumnsExample() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <Settings2 size={16} /> Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-[var(--radius-panel)] border border-fd-border bg-fd-popover p-4 text-sm shadow-lg">
        <p className="font-medium">Visible columns</p>
        <p className="mt-1 text-fd-muted-foreground">Choose which columns appear in the table.</p>
        <PopoverClose>
          <Button size="sm" className="mt-4 w-full">
            Done
          </Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}

/**
 * @title Mention preview
 * Hover a handle to preview the person without leaving the page.
 */
export function HoverCardProfileExample() {
  return (
    <HoverCard
      content={
        <HoverCardProfile
          name="Ada Lovelace"
          role="Engineering"
          bio="Writes the analytics pipeline and the motion presets behind it."
          stats={[{ label: "Components", value: "106" }, { label: "Blocks", value: "22" }]}
          meta="London"
        />
      }
    >
      <button className="rounded-[var(--radius-control)] border border-fd-border px-3 py-2 text-sm">@ada</button>
    </HoverCard>
  );
}

/**
 * @title Toolbar hints
 * Tooltips that explain icon-sized or terse controls.
 */
export function TooltipToolbarExample() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Copy the install command">
        <Button variant="secondary">Copy</Button>
      </Tooltip>
      <Tooltip content="Pinned to the top right" side="bottom">
        <Button variant="ghost" size="sm">
          Details
        </Button>
      </Tooltip>
    </div>
  );
}
