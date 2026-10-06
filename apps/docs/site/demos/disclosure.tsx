"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "arc/registry/components/tabs/tabs";
import { Accordion } from "arc/registry/components/accordion/accordion";
import { ScrollArea } from "arc/registry/components/scroll-area/scroll-area";
import { ExpandableCard } from "arc/registry/components/expandable-card/expandable-card";
import { ResizablePanel, ResizablePanels } from "arc/registry/components/resizable-panels/resizable-panels";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "arc/registry/components/dialog/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "arc/registry/components/drawer/drawer";
import { BottomSheet, BottomSheetClose } from "arc/registry/components/bottom-sheet/bottom-sheet";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "arc/registry/components/popover/popover";
import { HoverCard, HoverCardProfile } from "arc/registry/components/hover-card/hover-card";
import { Tooltip } from "arc/registry/components/tooltip/tooltip";
import { Button } from "arc/registry/components/button/button";

export function TabsDemo() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Everything about this project, in one place.</TabsContent>
      <TabsContent value="activity">Three deploys this week, one rollback.</TabsContent>
      <TabsContent value="settings">Branches, domains and environment variables.</TabsContent>
    </Tabs>
  );
}

export function AccordionDemo() {
  return (
    <Accordion
      defaultOpen={0}
      items={[
        { title: "Do I need Tailwind?", content: "No. Arc styles are CSS modules that read CSS variables." },
        { title: "Can I change the tokens?", content: "Change a value in foundation.css and every component follows." },
        { title: "What about dark mode?", content: "Set data-theme=\"dark\" on the html element. Values are tuned, not inverted." },
      ]}
    />
  );
}

export function ScrollAreaDemo() {
  return (
    <ScrollArea maxHeight={180} className="w-full max-w-sm rounded-[var(--radius-panel)] border border-fd-border p-4">
      <div className="flex flex-col gap-3 text-sm">
        {Array.from({ length: 12 }, (_, index) => (
          <p key={index} className="text-fd-muted-foreground">
            Row {index + 1}. The scrollbar fades in when you scroll and fades out when you stop.
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}

export function ExpandableCardDemo() {
  return (
    <ExpandableCard title="Quarterly plan" description="Three tracks, reviewed every Friday.">
      <p className="text-sm text-fd-muted-foreground">
        The card grows into a larger view in place, so the page around it never moves.
      </p>
    </ExpandableCard>
  );
}

export function ResizablePanelsDemo() {
  return (
    <ResizablePanels label="Editor split" className="h-48 w-full max-w-2xl rounded-[var(--radius-panel)] border border-fd-border">
      <ResizablePanel id="files" label="Files" defaultSize={40}>
        <div className="p-4 text-sm text-fd-muted-foreground">Files</div>
      </ResizablePanel>
      <ResizablePanel id="editor" label="Editor" defaultSize={60}>
        <div className="p-4 text-sm text-fd-muted-foreground">Editor</div>
      </ResizablePanel>
    </ResizablePanels>
  );
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent title="Rename project" description="The slug updates everywhere it is linked.">
        <div className="flex flex-col gap-4">
          <label className="text-sm">
            Project name
            <input className="mt-1 w-full rounded-[var(--radius-control)] border border-fd-border bg-fd-background px-3 py-2" defaultValue="arc-library" />
          </label>
          <div className="flex justify-end gap-2">
            <DialogClose>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <DialogClose>
              <Button>Save</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DrawerDemo() {
  return (
    <Drawer>
      <DrawerTrigger>
        <Button variant="secondary">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent title="Filters" description="Narrow the list without leaving the page.">
        <p className="text-sm text-fd-muted-foreground">
          A drag on the edge closes the panel, handing its velocity to the exit spring.
        </p>
        <DrawerClose>
          <Button>Show results</Button>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

export function BottomSheetDemo() {
  return (
    <BottomSheet
      title="Share this project"
      description="The sheet rises from the bottom edge on small screens."
      trigger={
        <Button variant="secondary" className="w-full">
          Open sheet
        </Button>
      }
    >
      <BottomSheetClose>
        <Button className="w-full">Copy link</Button>
      </BottomSheetClose>
    </BottomSheet>
  );
}

export function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="secondary">Column settings</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-[var(--radius-panel)] border border-fd-border bg-fd-popover p-4 text-sm shadow-lg">
        <p className="font-medium">Visible columns</p>
        <p className="mt-1 text-fd-muted-foreground">The panel stays anchored to the trigger while the trigger springs back.</p>
        <PopoverClose>
          <Button size="sm" className="mt-4 w-full">Done</Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}

export function HoverCardDemo() {
  return (
    <HoverCard
      content={
        <HoverCardProfile
          name="Elia Kuratli"
          role="Design engineering"
          bio="Builds Arc, and writes the motion presets behind it."
          stats={[{ label: "Components", value: "106" }, { label: "Blocks", value: "22" }]}
          meta="Berlin"
        />
      }
    >
      <button className="rounded-[var(--radius-control)] border border-fd-border px-3 py-2 text-sm">@elia</button>
    </HoverCard>
  );
}

export function TooltipDemo() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Copy the install command">
        <Button variant="secondary">Copy</Button>
      </Tooltip>
      <Tooltip content="Pinned to the top right" side="bottom">
        <Button variant="ghost" size="sm">Details</Button>
      </Tooltip>
    </div>
  );
}

export function SettingsDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="ghost" size="sm">
          <Settings2 size={16} /> Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 rounded-[var(--radius-panel)] border border-fd-border bg-fd-popover p-3 text-sm shadow-lg">
        Controlled popover, opened from state.
      </PopoverContent>
    </Popover>
  );
}