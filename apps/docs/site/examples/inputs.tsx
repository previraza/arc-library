"use client";

import { useState } from "react";
import { Button } from "manicat/registry/components/button/button";
import { Input } from "manicat/registry/components/input/input";
import { MorphSelect } from "manicat/registry/components/morph-select/morph-select";
import { Select } from "manicat/registry/components/select/select";
import { Switch } from "manicat/registry/components/switch/switch";
import { Checkbox } from "manicat/registry/components/checkbox/checkbox";
import SegmentedControl from "manicat/registry/components/segmented-control/segmented-control";

const timezones = [
  {
    label: "Europe",
    options: [
      { value: "Europe/London", label: "London", meta: "UTC+0", keywords: "uk gmt britain" },
      { value: "Europe/Paris", label: "Paris", meta: "UTC+1", keywords: "france cet" },
      { value: "Europe/Berlin", label: "Berlin", meta: "UTC+1", keywords: "germany cet" },
    ],
  },
  {
    label: "Americas",
    options: [
      { value: "America/New_York", label: "New York", meta: "UTC-5", keywords: "est usa" },
      { value: "America/Chicago", label: "Chicago", meta: "UTC-6", keywords: "cst usa" },
      { value: "America/Los_Angeles", label: "Los Angeles", meta: "UTC-8", keywords: "pst usa california" },
    ],
  },
];

/**
 * @title Timezone field
 * Grouped options with an offset on the right and search keywords, so typing “est” finds New York.
 */
export function MorphSelectTimezoneExample() {
  const [timezone, setTimezone] = useState<string | null>("Europe/Paris");

  return (
    <div className="grid w-full max-w-xs gap-2">
      <MorphSelect label="Timezone" value={timezone} onValueChange={setTimezone} items={timezones} searchable />
      <p className="text-sm text-fd-muted-foreground">Digest emails are sent at 8:00 in {timezone ?? "your timezone"}.</p>
    </div>
  );
}

const statuses = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To do" },
  { value: "progress", label: "In progress" },
  { value: "review", label: "In review" },
  { value: "done", label: "Done" },
];

const people = [
  { value: "ada", label: "Ada Lovelace", meta: "Design" },
  { value: "linus", label: "Linus Park", meta: "Engineering" },
  { value: "grace", label: "Grace Mbeki", meta: "Support" },
];

/**
 * @title Issue properties
 * Compact pickers in a ticket header; each trigger grows into its list and the chosen label settles back in.
 */
export function MorphSelectIssueExample() {
  const [status, setStatus] = useState<string | null>("progress");
  const [assignee, setAssignee] = useState<string | null>("ada");

  return (
    <div className="grid w-full max-w-md gap-4 rounded-[var(--radius-panel)] border border-fd-border bg-fd-card p-5">
      <div>
        <p className="text-xs text-fd-muted-foreground">MAN-482</p>
        <h4 className="text-base font-medium text-fd-foreground">Checkout button stalls on Safari 17</h4>
      </div>
      <div className="flex flex-wrap gap-3">
        <MorphSelect label="Status" value={status} onValueChange={setStatus} items={statuses} />
        <MorphSelect label="Assignee" value={assignee} onValueChange={setAssignee} items={people} />
      </div>
    </div>
  );
}

/**
 * @title Sign up form
 * Labels, helper text and an inline error that appears once the address is invalid.
 */
export function InputSignupExample() {
  const [email, setEmail] = useState("ada@");
  const [touched, setTouched] = useState(false);
  const invalid = touched && !/^\S+@\S+\.\S+$/.test(email);

  return (
    <form
      className="grid w-full max-w-sm gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
      }}
    >
      <Input label="Full name" placeholder="Ada Lovelace" autoComplete="name" />
      <Input
        label="Work email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        onBlur={() => setTouched(true)}
        description="We send the receipt here."
        error={invalid ? "Enter a valid email address." : undefined}
      />
      <Button type="submit">Create account</Button>
    </form>
  );
}

/**
 * @title Locked field
 * A disabled input that explains why it can't be edited.
 */
export function InputLockedExample() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Input label="Workspace URL" defaultValue="acme.manicat.dev" disabled description="Ask an owner to change the workspace URL." />
    </div>
  );
}

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "never", label: "Never", disabled: true },
];

/**
 * @title Report schedule
 * A native-feeling select with a disabled option and helper text.
 */
export function SelectScheduleExample() {
  const [frequency, setFrequency] = useState("weekly");

  return (
    <div className="grid w-full max-w-xs gap-2">
      <Select label="Send usage report" options={frequencies} value={frequency} onValueChange={setFrequency} description="Delivered Monday morning." />
    </div>
  );
}

/**
 * @title Notification settings
 * A settings card where each row pairs a label with a switch, and the master switch gates the others.
 */
export function SwitchSettingsExample() {
  const [enabled, setEnabled] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [digest, setDigest] = useState(false);

  return (
    <div className="grid w-full max-w-sm gap-4 rounded-[var(--radius-panel)] border border-fd-border bg-fd-card p-5">
      <Switch label="Push notifications" checked={enabled} onCheckedChange={setEnabled} />
      <div className="grid gap-3 border-t border-fd-border pt-4">
        <Switch label="Mentions and replies" checked={enabled && mentions} onCheckedChange={setMentions} disabled={!enabled} />
        <Switch label="Weekly digest" checked={enabled && digest} onCheckedChange={setDigest} disabled={!enabled} />
      </div>
    </div>
  );
}

const permissions = ["Read", "Comment", "Edit"];

/**
 * @title Select all
 * A parent checkbox that shows the indeterminate state while only some children are checked.
 */
export function CheckboxSelectAllExample() {
  const [selected, setSelected] = useState<string[]>(["Read"]);
  const all = selected.length === permissions.length;

  return (
    <div className="grid w-full max-w-xs gap-3">
      <Checkbox
        label="All permissions"
        checked={all ? true : selected.length > 0 ? "indeterminate" : false}
        onCheckedChange={(next) => setSelected(next === true ? permissions : [])}
      />
      <div className="grid gap-3 pl-7">
        {permissions.map((permission) => (
          <Checkbox
            key={permission}
            label={permission}
            checked={selected.includes(permission)}
            onCheckedChange={(next) =>
              setSelected((current) => (next === true ? [...current, permission] : current.filter((entry) => entry !== permission)))
            }
          />
        ))}
      </div>
    </div>
  );
}

/**
 * @title View switcher
 * Switch a project list between layouts; the choice drives what renders below.
 */
export function SegmentedControlViewExample() {
  const [view, setView] = useState("board");

  return (
    <div className="grid w-full max-w-sm gap-4">
      <SegmentedControl
        label="Layout"
        value={view}
        onValueChange={setView}
        options={[
          { value: "list", label: "List" },
          { value: "board", label: "Board" },
          { value: "calendar", label: "Calendar" },
        ]}
      />
      <div className="rounded-[var(--radius-control)] border border-dashed border-fd-border p-6 text-center text-sm text-fd-muted-foreground">
        Showing the {view} view
      </div>
    </div>
  );
}
