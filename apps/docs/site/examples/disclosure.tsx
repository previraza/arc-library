"use client";

import { useState } from "react";
import { Button } from "manicat/registry/components/button/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "manicat/registry/components/dialog/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "manicat/registry/components/tabs/tabs";
import { Accordion } from "manicat/registry/components/accordion/accordion";

/**
 * @title Rename dialog
 * A small form in a dialog: the dialog owns focus, closes on Escape and returns focus to the trigger.
 */
export function DialogRenameExample() {
  const [name, setName] = useState("arc-library");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Rename project</Button>
      </DialogTrigger>
      <DialogContent title="Rename project" description="The slug updates everywhere it is linked.">
        <div className="flex flex-col gap-4">
          <label className="text-sm">
            Project name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-[var(--radius-control)] border border-fd-border bg-fd-background px-3 py-2"
            />
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

/**
 * @title Destructive confirmation
 * Ask once, say exactly what will be lost, and keep Cancel as the first button.
 */
export function DialogConfirmExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger">Delete workspace</Button>
      </DialogTrigger>
      <DialogContent title="Delete Acme workspace?" description="14 projects and 3 members will lose access immediately.">
        <div className="flex justify-end gap-2">
          <DialogClose>
            <Button variant="secondary">Keep workspace</Button>
          </DialogClose>
          <DialogClose>
            <Button variant="danger">Delete</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * @title Project sections
 * Tabs for a project page; panels cross-fade and the selection indicator glides.
 */
export function TabsProjectExample() {
  return (
    <Tabs defaultValue="deployments" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="deployments">Deployments</TabsTrigger>
        <TabsTrigger value="domains">Domains</TabsTrigger>
        <TabsTrigger value="env">Environment</TabsTrigger>
      </TabsList>
      <TabsContent value="deployments">
        <p className="py-4 text-sm text-fd-muted-foreground">3 deployments this week, 1 rollback on Tuesday.</p>
      </TabsContent>
      <TabsContent value="domains">
        <p className="py-4 text-sm text-fd-muted-foreground">acme.com and www.acme.com, both verified.</p>
      </TabsContent>
      <TabsContent value="env">
        <p className="py-4 text-sm text-fd-muted-foreground">12 variables across Production and Preview.</p>
      </TabsContent>
    </Tabs>
  );
}

/**
 * @title FAQ
 * One open at a time, with the first answer open by default.
 */
export function AccordionFaqExample() {
  return (
    <div className="w-full max-w-lg">
      <Accordion
        defaultOpen={0}
        items={[
          { title: "Can I cancel at any time?", content: "Yes. Your plan stays active until the end of the billing period." },
          { title: "Do you offer refunds?", content: "Within 14 days of a purchase, no questions asked." },
          { title: "Is there a team discount?", content: "Teams of ten or more get 20% off. Contact us for a quote." },
        ]}
      />
    </div>
  );
}
