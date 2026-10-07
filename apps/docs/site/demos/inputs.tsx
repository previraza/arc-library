"use client";

import { useState } from "react";
import { Input } from "manicat/registry/components/input/input";
import { Textarea } from "manicat/registry/components/textarea/textarea";
import { PasswordField } from "manicat/registry/components/password-field/password-field";
import { PasswordStrength } from "manicat/registry/components/password-strength/password-strength";
import { SearchField } from "manicat/registry/components/search-field/search-field";
import { ExpandingSearch } from "manicat/registry/components/expanding-search/expanding-search";
import { InlineEdit } from "manicat/registry/components/inline-edit/inline-edit";
import { NumberField } from "manicat/registry/components/number-field/number-field";
import { MoneyInput } from "manicat/registry/components/money-input/money-input";
import { PhoneInput } from "manicat/registry/components/phone-input/phone-input";
import { TagInput } from "manicat/registry/components/tag-input/tag-input";
import { MentionInput } from "manicat/registry/components/mention-input/mention-input";
import { ShortcutRecorder } from "manicat/registry/components/shortcut-recorder/shortcut-recorder";
import { Select } from "manicat/registry/components/select/select";
import { Combobox } from "manicat/registry/components/combobox/combobox";
import { MultiSelect } from "manicat/registry/components/multi-select/multi-select";
import { MorphSelect } from "manicat/registry/components/morph-select/morph-select";
import { ChipGroup } from "manicat/registry/components/chip-group/chip-group";
import SegmentedControl from "manicat/registry/components/segmented-control/segmented-control";
import { Checkbox } from "manicat/registry/components/checkbox/checkbox";
import { RadioGroup } from "manicat/registry/components/radio-group/radio-group";
import { Switch } from "manicat/registry/components/switch/switch";
import { RadioCards } from "manicat/registry/components/radio-cards/radio-cards";
import { BillingPrice, BillingToggle } from "manicat/registry/components/billing-toggle/billing-toggle";
import type { SliderValue } from "manicat/registry/components/slider/slider";
import { Slider } from "manicat/registry/components/slider/slider";
import { Calendar } from "manicat/registry/components/calendar/calendar";
import { DatePicker } from "manicat/registry/components/date-picker/date-picker";
import type { DateRange } from "manicat/registry/components/date-range-picker/date-range-picker";
import { DateRangePicker } from "manicat/registry/components/date-range-picker/date-range-picker";
import { TimePicker } from "manicat/registry/components/time-picker/time-picker";
import { ColorPicker } from "manicat/registry/components/color-picker/color-picker";
import { OtpInput } from "manicat/registry/components/otp-input/otp-input";

export function InputDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Input label="Email" placeholder="ada@example.com" description="We only use it for receipts." />
      <Input label="Team URL" defaultValue="arc-labs" error="That URL is already taken." />
      <Input label="Disabled" placeholder="Locked" disabled />
    </div>
  );
}

export function TextareaDemo() {
  const [value, setValue] = useState("");

  return (
    <div className="grid w-full max-w-md gap-4">
      <Textarea label="Changelog entry" placeholder="What changed?" value={value} onChange={(event) => setValue(event.target.value)} rows={5} />
      <Textarea label="Short note" defaultValue="Kept to two lines." rows={2} description="Two lines is enough." />
    </div>
  );
}

export function PasswordFieldDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <PasswordField label="Password" placeholder="At least 12 characters" />
      <PasswordField label="Too short" defaultValue="short" description="Use at least 12 characters." />
    </div>
  );
}

export function PasswordStrengthDemo() {
  const [value, setValue] = useState("");

  return (
    <div className="grid w-full max-w-sm gap-4">
      <PasswordStrength label="Password" value={value} onValueChange={(next) => setValue(next)} />
      <p className="text-sm text-fd-muted-foreground">Strength is the share of rules met, spread over four steps.</p>
    </div>
  );
}

const searchItems = [
  { id: "button", title: "Button", group: "Actions", meta: "component", keywords: ["cta", "action"] },
  { id: "dialog", title: "Dialog", group: "Disclosure", meta: "component" },
  { id: "line-chart", title: "Line chart", group: "Data", meta: "component", keywords: ["graph", "series"] },
  { id: "hero-section", title: "Hero section", group: "Blocks", meta: "block" },
];

export function SearchFieldDemo() {
  const [value, setValue] = useState("");

  return (
    <div className="grid w-full max-w-sm gap-2">
      <SearchField label="Search" value={value} onValueChange={setValue} placeholder="Find a component" />
      <p className="text-sm text-fd-muted-foreground">{value ? `Searching for “${value}”` : "Type to search."}</p>
    </div>
  );
}

export function ExpandingSearchDemo() {
  return (
    <div className="flex min-h-16 items-center justify-center">
      <ExpandingSearch label="Search the library" placeholder="Search components" items={searchItems} />
    </div>
  );
}

export function InlineEditDemo() {
  const [title, setTitle] = useState("Quarterly plan");

  return (
    <div className="rounded-[var(--radius-panel)] border border-fd-border p-6 text-center">
      <InlineEdit value={title} onSave={setTitle} label="Title" />
      <p className="mt-2 text-sm text-fd-muted-foreground">Click the title to edit it in place.</p>
    </div>
  );
}

export function NumberFieldDemo() {
  const [seats, setSeats] = useState(12);

  return <NumberField label="Seats" value={seats} onValueChange={setSeats} min={1} max={64} scrub suffix=" seats" />;
}

export function MoneyInputDemo() {
  const [amount, setAmount] = useState<number | null>(1250);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <MoneyInput label="Amount" value={amount} onValueChange={setAmount} defaultCurrency="USD" />
      <p className="text-sm text-fd-muted-foreground">{amount === null ? "Nothing charged." : `${amount.toFixed(2)} in the currency above`}</p>
    </div>
  );
}

export function PhoneInputDemo() {
  return <PhoneInput label="Phone" defaultCountry="GB" defaultValue="+447911123456" />;
}

export function TagInputDemo() {
  const [tags, setTags] = useState(["design", "motion"]);

  return <TagInput label="Topics" value={tags} onValueChange={setTags} placeholder="Add a topic" />;
}

export function MentionInputDemo() {
  return (
    <MentionInput
      aria-label="Note"
      placeholder="Write a note, @ to mention someone"
      people={[{ id: "ada", name: "Ada Lovelace", role: "Engineering" }]}
      channels={[{ id: "general", name: "general", members: 12 }]}
    />
  );
}

export function ShortcutRecorderDemo() {
  const [shortcut, setShortcut] = useState<string | null>(null);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <ShortcutRecorder label="Shortcut" value={shortcut} onValueChange={setShortcut} />
      <p className="text-sm text-fd-muted-foreground">{shortcut ? `Recorded: ${shortcut}` : "Click, then press keys."}</p>
    </div>
  );
}

const selectOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "never", label: "Never", disabled: true },
];

export function SelectDemo() {
  const [value, setValue] = useState("weekly");

  return <Select label="Report frequency" options={selectOptions} value={value} onValueChange={setValue} description="We send it in your timezone." />;
}

export function ComboboxDemo() {
  const [value, setValue] = useState("");

  return (
    <Combobox
      label="Framework"
      placeholder="Choose a framework"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "next", label: "Next.js", keywords: ["react", "app router"] },
        { value: "vite", label: "Vite", keywords: ["react", "bundler"] },
        { value: "astro", label: "Astro", keywords: ["islands"] },
        { value: "waku", label: "Waku", keywords: ["react"] },
      ]}
    />
  );
}

export function MultiSelectDemo() {
  const [value, setValue] = useState(["design", "motion"]);

  return (
    <MultiSelect
      label="Skills"
      value={value}
      onValueChange={setValue}
      maxVisible={2}
      options={[
        { value: "design", label: "Design" },
        { value: "motion", label: "Motion" },
        { value: "data", label: "Data visualisation" },
        { value: "a11y", label: "Accessibility" },
        { value: "i18n", label: "Internationalisation" },
      ]}
    />
  );
}

export function MorphSelectDemo() {
  const [value, setValue] = useState<string | null>("bill");

  return (
    <MorphSelect
      label="Deploy target"
      value={value}
      onValueChange={(next) => setValue(next)}
      items={[
        { label: "Staging", options: [{ value: "preview", label: "Preview", meta: "3 min" }, { value: "bill", label: "Bill", meta: "now" }] },
        { label: "Production", options: [{ value: "eu", label: "Europe", meta: "1 region" }, { value: "us", label: "United States", meta: "2 regions" }] },
      ]}
    />
  );
}

const chipOptions = [
  { value: "react", label: "React" },
  { value: "motion", label: "Motion" },
  { value: "charts", label: "Charts" },
  { value: "forms", label: "Forms" },
  { value: "tables", label: "Tables" },
  { value: "text", label: "Text effects" },
];

export function ChipGroupDemo() {
  const [value, setValue] = useState(["react", "charts"]);

  return <ChipGroup label="Topics" multiple options={chipOptions} value={value} onValueChange={setValue} maxVisible={3} />;
}

export function SegmentedControlDemo() {
  const [value, setValue] = useState("grid");

  return (
    <SegmentedControl
      label="Layout"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "grid", label: "Grid" },
        { value: "list", label: "List" },
        { value: "map", label: "Map" },
      ]}
    />
  );
}

export function CheckboxDemo() {
  const [checked, setChecked] = useState<boolean | "indeterminate">("indeterminate");

  return (
    <div className="grid gap-3">
      <Checkbox
        label="Email me about releases"
        checked={checked === "indeterminate" ? "indeterminate" : checked}
        onCheckedChange={(next) => setChecked(next === true ? true : next === "indeterminate" ? "indeterminate" : false)}
      />
      <Checkbox label="Include a digest" description="One email a week, never more." />
      <Checkbox label="Locked" disabled />
    </div>
  );
}

export function RadioGroupDemo() {
  const [value, setValue] = useState("monthly");

  return (
    <RadioGroup
      label="Billing period"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "monthly", label: "Monthly", description: "Cancel any time." },
        { value: "yearly", label: "Yearly", description: "Two months free." },
      ]}
    />
  );
}

export function SwitchDemo() {
  const [checked, setChecked] = useState(true);

  return (
    <div className="grid gap-3">
      <Switch label="Reduced motion" checked={checked} onCheckedChange={setChecked} />
      <Switch label="Always on" />
    </div>
  );
}

export function RadioCardsDemo() {
  const [value, setValue] = useState("pro");

  return (
    <RadioCards
      aria-label="Plan"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "free", label: "Free", description: "The whole core library." },
        { value: "pro", label: "Pro", description: "Motion components and larger blocks." },
      ]}
    />
  );
}

export function BillingToggleDemo() {
  const [period, setPeriod] = useState("yearly");

  return (
    <div className="grid justify-items-center gap-3">
      <BillingToggle value={period} onValueChange={setPeriod} />
      <BillingPrice amount={period === "yearly" ? 190 : 19} period={period === "yearly" ? "per year" : "per month"} was={period === "yearly" ? 228 : undefined} />
    </div>
  );
}

export function SliderDemo() {
  const [volume, setVolume] = useState<SliderValue>(40);

  return <Slider label="Volume" value={volume} onValueChange={setVolume} />;
}

export function CalendarDemo() {
  const [value, setValue] = useState<Date | undefined>(new Date(2026, 9, 5));

  return <Calendar value={value} onChange={setValue} month={new Date(2026, 9, 1)} onMonthChange={() => {}} showToday />;
}

export function DatePickerDemo() {
  const [date, setDate] = useState<Date | null>(new Date(2026, 9, 5));

  return <DatePicker label="Ship date" value={date ?? undefined} onChange={(next) => setDate(next ?? null)} />;
}

export function DateRangePickerDemo() {
  const [range, setRange] = useState<DateRange | null>(null);

  return <DateRangePicker label="Billing period" value={range} onChange={setRange} />;
}

export function TimePickerDemo() {
  return <TimePicker label="Standup" defaultValue="09:30" />;
}

export function ColorPickerDemo() {
  const [value, setValue] = useState("#7747ff");

  return <ColorPicker label="Accent" value={value} onValueChange={setValue} />;
}

export function OtpInputDemo() {
  const [value, setValue] = useState("");

  return <OtpInput label="Verification code" length={6} value={value} onChange={setValue} />;
}

export function SearchFieldClearDemo() {
  const [value, setValue] = useState("arc");

  return <SearchField label="Search" value={value} onValueChange={setValue} placeholder="Search components" />;
}