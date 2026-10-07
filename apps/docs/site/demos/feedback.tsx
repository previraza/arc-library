"use client";

import { useState } from "react";
import { Alert } from "manicat/registry/components/alert/alert";
import Toast from "manicat/registry/components/toast/toast";
import { ToastStack, ToastStackProvider, useToastStack } from "manicat/registry/components/toast-stack/toast-stack";
import { AnnouncementBar } from "manicat/registry/components/announcement-bar/announcement-bar";
import { Progress } from "manicat/registry/components/progress/progress";
import { Skeleton } from "manicat/registry/components/skeleton/skeleton";
import { Stepper } from "manicat/registry/components/stepper/stepper";
import { UsageMeter } from "manicat/registry/components/usage-meter/usage-meter";
import { Avatar } from "manicat/registry/components/avatar/avatar";
import { AvatarGroup } from "manicat/registry/components/avatar-group/avatar-group";
import { Badge } from "manicat/registry/components/badge/badge";
import { Card } from "manicat/registry/components/card/card";
import { MetricCard } from "manicat/registry/components/metric-card/metric-card";
import { EmptyState } from "manicat/registry/components/empty-state/empty-state";
import { Button } from "manicat/registry/components/button/button";

export function AlertDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="grid w-full max-w-lg gap-3">
      <Alert tone="info" title="Heads up" onDismiss={() => setOpen(false)} open={open}>
        Your trial ends in three days. Add a payment method to keep the workspace.
      </Alert>
      <Alert tone="success" title="Deployed">
        manicat-library is live on manicat.dev.
      </Alert>
      <Alert tone="warning" title="Slow build">
        The last build took 4 minutes 12 seconds.
      </Alert>
      <Alert tone="danger" title="Build failed">
        Two components failed to typecheck.
      </Alert>
    </div>
  );
}

export function ToastDemo() {
  const [open, setOpen] = useState(true);

  return (
    <ToastStackProvider>
      <div className="grid justify-items-center gap-3">
        <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide toast" : "Show toast"}
        </Button>
        <Toast title="Copied to clipboard" description="The install command is on your clipboard." open={open} onOpenChange={setOpen} />
      </div>
    </ToastStackProvider>
  );
}

export function ToastStackDemo() {
  return (
    <ToastStackProvider>
      <ToastStackDemoInner />
    </ToastStackProvider>
  );
}

function ToastStackDemoInner() {
  const { toast, update, dismiss } = useToastStack();
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={() => {
          const id = toast({ title: "Publishing", description: "Uploading assets.", type: "loading" });
          setTimeout(() => update(id, { title: "Published", description: "arc-library is live.", type: "success" }), 1400);
        }}
      >
        Publish with a morphing toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          setCount((value) => value + 1);
          toast({ title: `Undo delete (${count + 1})`, type: "info", action: { label: "Undo", onClick: () => dismiss() } });
        }}
      >
        Toast with an action
      </Button>
      <ToastStack contained position="bottom-center" />
    </div>
  );
}

export function AnnouncementBarDemo() {
  return (
    <AnnouncementBar
      messages={[
        { id: "pro", message: "Manicat Pro adds 43 motion components and the larger blocks.", action: { label: "See Pro", onClick: () => {} } },
        { id: "registry", message: "Every item installs with the shadcn CLI.", action: { label: "Installation", onClick: () => {} } },
      ]}
    />
  );
}

export function ProgressDemo() {
  const [value, setValue] = useState(64);

  return (
    <div className="grid w-full max-w-sm gap-4">
      <Progress label="Migrating components" value={value} showValue />
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setValue((current) => Math.max(0, current - 20))}>
          -20
        </Button>
        <Button size="sm" onClick={() => setValue((current) => Math.min(100, current + 20))}>
          +20
        </Button>
      </div>
    </div>
  );
}

export function SkeletonDemo() {
  return (
    <div className="grid w-full max-w-md gap-3">
      <Skeleton avatar lines={3} label="Loading profile" />
      <Skeleton lines={2} />
    </div>
  );
}

export function SkeletonRevealDemo() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="grid w-full max-w-md gap-3">
      <Button size="sm" variant="secondary" onClick={() => setLoading((value) => !value)}>
        {loading ? "Finish loading" : "Load again"}
      </Button>
      <Skeleton loading={loading} lines={2}>
        <p className="text-sm text-fd-muted-foreground">The placeholder crossfades into the content once loading finishes.</p>
      </Skeleton>
    </div>
  );
}

const steps = [
  { id: "plan", label: "Plan", description: "Choose a template and a plan." },
  { id: "connect", label: "Connect", description: "Link your GitHub repository." },
  { id: "deploy", label: "Deploy", description: "Ship the first version." },
];

export function StepperDemo() {
  const [current, setCurrent] = useState(1);

  return (
    <div className="grid w-full max-w-2xl gap-4">
      <Stepper steps={steps} current={current} onStepSelect={setCurrent} details="all" />
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setCurrent((value) => Math.max(0, value - 1))}>
          Back
        </Button>
        <Button size="sm" onClick={() => setCurrent((value) => Math.min(steps.length, value + 1))}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function UsageMeterDemo() {
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

export function AvatarDemo() {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="Elia Kuratli" size="sm" />
      <Avatar name="Ada Lovelace" status="online" />
      <Avatar name="Grace Hopper" size="lg" />
      <Avatar name="Alan Turing" size="xl" status="offline" />
    </div>
  );
}

export function AvatarGroupDemo() {
  return (
    <AvatarGroup
      members={[
        { name: "Ada Lovelace", src: "https://i.pravatar.cc/96?img=47" },
        { name: "Grace Hopper", src: "https://i.pravatar.cc/96?img=32" },
        { name: "Alan Turing", src: "https://i.pravatar.cc/96?img=13" },
        { name: "Katherine Johnson", src: "https://i.pravatar.cc/96?img=45" },
        { name: "Barbara Liskov", src: "https://i.pravatar.cc/96?img=44" },
      ]}
    />
  );
}

export function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Neutral</Badge>
      <Badge tone="success">Shipped</Badge>
      <Badge tone="info">Beta</Badge>
      <Badge tone="warning">Deprecated</Badge>
      <Badge tone="danger">Blocked</Badge>
      <Badge tone="neutral" size="sm">Small</Badge>
    </div>
  );
}

export function CardDemo() {
  return (
    <div className="grid w-full max-w-md gap-4">
      <Card title="Quiet motion" description="Springs for anything that moves on screen." status="Updated 2 hours ago">
        <p className="text-sm text-fd-muted-foreground">
          Cards carry a title, an optional status and any content. With details set, the card opens into a larger view in
          place.
        </p>
      </Card>
    </div>
  );
}

export function MetricCardDemo() {
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

export function EmptyStateDemo() {
  return (
    <EmptyState
      title="No projects yet"
      description="Create your first project to see deployments, domains and usage here."
      icon={<Badge tone="info">New</Badge>}
      action={<Button>Create project</Button>}
    />
  );
}