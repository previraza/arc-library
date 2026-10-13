"use client";

import { useState } from "react";
import { Button } from "manicat/registry/components/button/button";
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
import { Combobox } from "manicat/registry/components/combobox/combobox";
import { MultiSelect } from "manicat/registry/components/multi-select/multi-select";
import { ChipGroup } from "manicat/registry/components/chip-group/chip-group";
import { RadioGroup } from "manicat/registry/components/radio-group/radio-group";
import { RadioCards } from "manicat/registry/components/radio-cards/radio-cards";
import { BillingPrice, BillingToggle } from "manicat/registry/components/billing-toggle/billing-toggle";
import { Slider } from "manicat/registry/components/slider/slider";
import type { SliderValue } from "manicat/registry/components/slider/slider";
import { Calendar } from "manicat/registry/components/calendar/calendar";
import { DatePicker } from "manicat/registry/components/date-picker/date-picker";
import { DateRangePicker } from "manicat/registry/components/date-range-picker/date-range-picker";
import type { DateRange } from "manicat/registry/components/date-range-picker/date-range-picker";
import { TimePicker } from "manicat/registry/components/time-picker/time-picker";
import { ColorPicker } from "manicat/registry/components/color-picker/color-picker";
import { OtpInput } from "manicat/registry/components/otp-input/otp-input";

/**
 * @title Feedback form
 * A message box with a live character counter that turns into an error past the limit.
 */
export function TextareaFeedbackExample() {
  const [message, setMessage] = useState("");
  const limit = 280;
  const over = message.length > limit;

  return (
    <div className="grid w-full max-w-md gap-3">
      <Textarea
        label="What could be better?"
        placeholder="Tell us what got in your way"
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        error={over ? `${message.length - limit} characters over the limit.` : undefined}
        description={`${message.length}/${limit}`}
      />
      <Button disabled={!message || over}>Send feedback</Button>
    </div>
  );
}

/**
 * @title Create a password
 * Password field, strength meter and a confirmation that only validates once both match.
 */
export function PasswordFieldCreateExample() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="grid w-full max-w-sm gap-4">
      <PasswordStrength label="New password" value={password} onValueChange={setPassword} />
      <PasswordField
        label="Confirm password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        description={mismatch ? "Passwords don't match yet." : "Type it once more."}
      />
    </div>
  );
}

/**
 * @title Strength meter
 * The meter on its own, driven by whatever the user has typed so far.
 */
export function PasswordStrengthLiveExample() {
  const [value, setValue] = useState("manicat");

  return (
    <div className="grid w-full max-w-sm gap-3">
      <PasswordStrength label="Password" value={value} onValueChange={setValue} />
      <p className="text-sm text-fd-muted-foreground">Add digits, symbols and length to move the meter.</p>
    </div>
  );
}

const components = [
  { id: "button", title: "Button", group: "Actions", meta: "component", keywords: ["cta", "action"] },
  { id: "dialog", title: "Dialog", group: "Disclosure", meta: "component" },
  { id: "line-chart", title: "Line chart", group: "Data", meta: "component", keywords: ["graph", "series"] },
  { id: "hero-section", title: "Hero section", group: "Blocks", meta: "block" },
];

/**
 * @title Filter a list
 * A search field that filters the list under it as you type.
 */
export function SearchFieldFilterExample() {
  const [query, setQuery] = useState("");
  const results = components.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="grid w-full max-w-sm gap-3">
      <SearchField label="Search" value={query} onValueChange={setQuery} placeholder="Find a component" />
      <ul className="grid gap-1 text-sm">
        {results.map((item) => (
          <li key={item.id} className="flex justify-between rounded-[var(--radius-control)] px-3 py-1.5 hover:bg-fd-accent">
            <span className="text-fd-foreground">{item.title}</span>
            <span className="text-fd-muted-foreground">{item.group}</span>
          </li>
        ))}
        {results.length === 0 && <li className="px-3 py-1.5 text-fd-muted-foreground">No match for “{query}”.</li>}
      </ul>
    </div>
  );
}

/**
 * @title Toolbar search
 * A search that lives as an icon in a toolbar and grows into a field with grouped results.
 */
export function ExpandingSearchToolbarExample() {
  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-fd-border bg-fd-card p-3">
      <span className="px-2 text-sm font-medium text-fd-foreground">Library</span>
      <ExpandingSearch label="Search the library" placeholder="Search components" items={components} />
    </div>
  );
}

/**
 * @title Editable title
 * A document title that edits in place and saves on Enter or blur.
 */
export function InlineEditTitleExample() {
  const [title, setTitle] = useState("Q4 launch plan");

  return (
    <div className="grid w-full max-w-sm gap-1 rounded-[var(--radius-panel)] border border-fd-border bg-fd-card p-5">
      <p className="text-xs text-fd-muted-foreground">Document</p>
      <InlineEdit value={title} onSave={setTitle} label="Title" />
    </div>
  );
}

/**
 * @title Seat picker
 * Buy seats with a stepper, a scrubbable value and a running total.
 */
export function NumberFieldSeatsExample() {
  const [seats, setSeats] = useState(12);

  return (
    <div className="grid w-full max-w-xs gap-3">
      <NumberField label="Seats" value={seats} onValueChange={setSeats} min={1} max={64} scrub suffix=" seats" />
      <p className="text-sm text-fd-muted-foreground">${seats * 12}/month, billed to the workspace owner.</p>
    </div>
  );
}

/**
 * @title Invoice amount
 * A currency field that returns minor-unit-safe numbers.
 */
export function MoneyInputInvoiceExample() {
  const [amount, setAmount] = useState<number | null>(1250);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <MoneyInput label="Invoice amount" value={amount} onValueChange={setAmount} defaultCurrency="USD" />
      <p className="text-sm text-fd-muted-foreground">{amount === null ? "Nothing will be charged." : `Customer pays ${amount.toFixed(2)}.`}</p>
    </div>
  );
}

/**
 * @title Contact phone
 * Country picker and number in one field, prefilled from the user's profile.
 */
export function PhoneInputContactExample() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <PhoneInput label="Mobile number" defaultCountry="GB" defaultValue="+447911123456" />
    </div>
  );
}

/**
 * @title Post topics
 * Add tags with Enter, remove them with Backspace.
 */
export function TagInputTopicsExample() {
  const [tags, setTags] = useState(["design", "motion"]);

  return (
    <div className="grid w-full max-w-sm gap-2">
      <TagInput label="Topics" value={tags} onValueChange={setTags} placeholder="Add a topic" />
      <p className="text-sm text-fd-muted-foreground">{tags.length} of 5 topics used.</p>
    </div>
  );
}

/**
 * @title Team note
 * Mention people with @ and channels with # while writing a note.
 */
export function MentionInputNoteExample() {
  return (
    <div className="w-full max-w-md">
      <MentionInput
        aria-label="Note"
        placeholder="Write a note, @ to mention someone"
        people={[
          { id: "ada", name: "Ada Lovelace", role: "Engineering" },
          { id: "grace", name: "Grace Mbeki", role: "Support" },
        ]}
        channels={[{ id: "general", name: "general", members: 12 }]}
      />
    </div>
  );
}

/**
 * @title Keyboard settings
 * Record a custom shortcut and show it back to the user.
 */
export function ShortcutRecorderSettingsExample() {
  const [shortcut, setShortcut] = useState<string | null>(null);

  return (
    <div className="grid w-full max-w-sm gap-3">
      <ShortcutRecorder label="Open command menu" value={shortcut} onValueChange={setShortcut} />
      <p className="text-sm text-fd-muted-foreground">{shortcut ? `Saved: ${shortcut}` : "Click the field, then press your keys."}</p>
    </div>
  );
}

/**
 * @title Framework picker
 * A searchable list where keywords help: typing “react” also finds Next.js and Vite.
 */
export function ComboboxFrameworkExample() {
  const [value, setValue] = useState("");

  return (
    <div className="grid w-full max-w-xs gap-2">
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
      <p className="text-sm text-fd-muted-foreground">{value ? `Starter: ${value}` : "No starter chosen yet."}</p>
    </div>
  );
}

/**
 * @title Skills
 * Multiple choices summarised into the trigger once there are more than two.
 */
export function MultiSelectSkillsExample() {
  const [value, setValue] = useState(["design", "motion"]);

  return (
    <div className="w-full max-w-sm">
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
    </div>
  );
}

/**
 * @title Topic filter
 * Chips for filtering a feed; overflow collapses into a +N chip.
 */
export function ChipGroupTopicsExample() {
  const [value, setValue] = useState(["react", "charts"]);

  return (
    <ChipGroup
      label="Topics"
      multiple
      value={value}
      onValueChange={setValue}
      maxVisible={3}
      options={[
        { value: "react", label: "React" },
        { value: "motion", label: "Motion" },
        { value: "charts", label: "Charts" },
        { value: "forms", label: "Forms" },
        { value: "tables", label: "Tables" },
        { value: "text", label: "Text effects" },
      ]}
    />
  );
}

/**
 * @title Billing period
 * Radio options with a description under each label.
 */
export function RadioGroupBillingExample() {
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

/**
 * @title Plan selection
 * Bigger touch targets for choices that deserve a sentence of explanation.
 */
export function RadioCardsPlanExample() {
  const [value, setValue] = useState("pro");

  return (
    <div className="w-full max-w-md">
      <RadioCards
        aria-label="Plan"
        value={value}
        onValueChange={setValue}
        options={[
          { value: "free", label: "Free", description: "The whole core library." },
          { value: "pro", label: "Pro", description: "Motion components and larger blocks." },
          { value: "team", label: "Team", description: "Shared tokens and priority support." },
        ]}
      />
    </div>
  );
}

/**
 * @title Pricing toggle
 * The price animates when the billing period flips.
 */
export function BillingTogglePricingExample() {
  const [period, setPeriod] = useState("yearly");

  return (
    <div className="grid justify-items-center gap-3">
      <BillingToggle value={period} onValueChange={setPeriod} />
      <BillingPrice amount={period === "yearly" ? 190 : 19} period={period === "yearly" ? "per year" : "per month"} was={period === "yearly" ? 228 : undefined} />
    </div>
  );
}

/**
 * @title Volume
 * A labelled slider with the value reflected next to the control.
 */
export function SliderVolumeExample() {
  const [volume, setVolume] = useState<SliderValue>(40);

  return (
    <div className="grid w-full max-w-sm gap-2">
      <Slider label="Volume" value={volume} onValueChange={setVolume} />
      <p className="text-sm text-fd-muted-foreground">Currently {String(volume)}%.</p>
    </div>
  );
}

/**
 * @title Month view
 * A controlled calendar that follows the month the user navigates to.
 */
export function CalendarMonthExample() {
  const [value, setValue] = useState<Date | undefined>(new Date(2026, 9, 5));
  const [month, setMonth] = useState(new Date(2026, 9, 1));

  return <Calendar value={value} onChange={setValue} month={month} onMonthChange={setMonth} showToday />;
}

/**
 * @title Ship date
 * A date field that opens a calendar and tells the user how far away the date is.
 */
export function DatePickerShipExample() {
  const [date, setDate] = useState<Date | null>(new Date(2026, 9, 5));

  return (
    <div className="grid w-full max-w-xs gap-2">
      <DatePicker label="Ship date" value={date ?? undefined} onChange={(next) => setDate(next ?? null)} />
      <p className="text-sm text-fd-muted-foreground">{date ? date.toDateString() : "Pick a date to schedule the release."}</p>
    </div>
  );
}

/**
 * @title Billing period
 * Pick a start and an end, e.g. to filter invoices.
 */
export function DateRangePickerBillingExample() {
  const [range, setRange] = useState<DateRange | null>(null);

  return (
    <div className="w-full max-w-sm">
      <DateRangePicker label="Billing period" value={range} onChange={setRange} />
    </div>
  );
}

/**
 * @title Standup time
 * A time field with a sensible default.
 */
export function TimePickerStandupExample() {
  return (
    <div className="w-full max-w-xs">
      <TimePicker label="Daily standup" defaultValue="09:30" />
    </div>
  );
}

/**
 * @title Brand accent
 * Choose a colour and see it applied to a live swatch.
 */
export function ColorPickerBrandExample() {
  const [value, setValue] = useState("#7747ff");

  return (
    <div className="grid w-full max-w-xs gap-3">
      <ColorPicker label="Accent" value={value} onValueChange={setValue} />
      <div className="h-10 rounded-[var(--radius-control)]" style={{ background: value }} />
    </div>
  );
}

/**
 * @title Verify your email
 * Six digits, auto-advancing, with paste support, then a confirm button.
 */
export function OtpInputVerifyExample() {
  const [code, setCode] = useState("");

  return (
    <div className="grid w-full max-w-sm gap-4">
      <OtpInput label="Verification code" length={6} value={code} onChange={setCode} />
      <Button disabled={code.length < 6}>Verify</Button>
    </div>
  );
}
