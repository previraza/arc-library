<script lang="ts" module>
export type ContactSectionVariant = "form" | "channels" | "offices";
export interface ContactMessage { name: string; email: string; topic: string; message: string }
export interface ContactChannel {
  value: string;
  label: string;
  /** One line under the label in the list, such as a response time. */
  meta: string;
  /** The detail shown when the channel is selected. */
  detail: string;
  /** A value shown with a copy button, such as an email address. */
  copyValue?: string;
  /** The action button of the detail. Clicking it confirms in place. */
  action?: { label: string; doneLabel: string };
}
export interface ContactOffice {
  city: string;
  /** IANA time zone, used for the live local time and open status. */
  timeZone: string;
  address: string[];
  email?: string;
  /** Opening hours in local 24 hour time. Defaults to 9 to 18. */
  hours?: [number, number];
}
</script>

<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";
  import Input from "@/registry/components/input/input.svelte";
  import SegmentedControl from "@/registry/components/segmented-control/segmented-control.svelte";
  import Textarea from "@/registry/components/textarea/textarea.svelte";

const exampleChannels: ContactChannel[] = [
  { value: "chat", label: "Chat with support", meta: "Replies in about 4 minutes", detail: "Hannah and Jordan are online now. Chat is best for quick questions about installing, theming, or a component that misbehaves.", action: { label: "Start a chat", doneLabel: "Chat started" } },
  { value: "email", label: "Email support", meta: "Replies within a business day", detail: "Send screenshots, links, or a reproduction. Every message gets a reply from a person within one business day.", copyValue: "support@example.com" },
  { value: "sales", label: "Talk to sales", meta: "Weekdays, 9am to 6pm PT", detail: "Licensing for a larger team, invoicing, or a security review. Tyler will walk you through it on a 20 minute call.", copyValue: "+1 (415) 555-0132", action: { label: "Request a call", doneLabel: "Call requested" } },
  { value: "community", label: "Ask the community", meta: "4,200 members", detail: "Designers and engineers who ship with Manicat UI answer questions about components, theming, and motion, usually within the hour.", action: { label: "Open the forum", doneLabel: "Forum opened" } },
];
const exampleOffices: ContactOffice[] = [
  { city: "San Francisco", timeZone: "America/Los_Angeles", address: ["100 Example Street, Floor 4", "San Francisco, CA 94000"], email: "sf@example.com" },
  { city: "New York", timeZone: "America/New_York", address: ["200 Sample Avenue, Suite 12", "New York, NY 10000"], email: "nyc@example.com" },
  { city: "Lisbon", timeZone: "Europe/Lisbon", address: ["Rua do Exemplo 10, 3º", "1000-000 Lisboa, Portugal"], email: "lisbon@example.com" },
];
const copy = {
  form: { title: "Talk to our team", description: "Questions about licensing, a bug you can't pin down, or a component you wish existed. A person reads every message." },
  channels: { title: "Get help your way", description: "Pick whatever suits the question. Every channel reaches the same small team." },
  offices: { title: "Visit us", description: "We work across three time zones, so someone is usually awake. Drop by for coffee, just let us know first." },
};

  interface Props {
    variant?: ContactSectionVariant;
    title?: string;
    description?: string;
    topics?: string[];
    channels?: ContactChannel[];
    offices?: ContactOffice[];
    /** Called with a valid message. Reject to keep the form and show an error; resolve to show the confirmation. */
    onSubmit?: (message: ContactMessage) => void | Promise<void>;
    /** Extend the inner, named parts of the block: title, description or card. */
    classNames?: { title?: string; description?: string; card?: string };
  }

  let { variant = "form", title, description, topics = ["Sales", "Support", "Partnerships", "Press"], channels = exampleChannels, offices = exampleOffices, onSubmit, classNames }: Props = $props();

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const MAX_MESSAGE = 500;
  const text = $derived(copy[variant]);

  let values = $state({ name: "", email: "", message: "" });
  // svelte-ignore state_referenced_locally
  let topic = $state(topics[0] ?? "");
  let submitted = $state(false);
  let phase = $state<"editing" | "sending" | "sent">("editing");
  let failure = $state("");
  const errors = $derived({
    name: values.name.trim() ? "" : "Enter your name",
    email: !values.email.trim() ? "Enter your email address" : EMAIL.test(values.email.trim()) ? "" : "Enter an email like name@example.com",
    message: values.message.trim().length >= 20 ? "" : values.message.trim() ? "Add a little more detail, at least 20 characters" : "Tell us how we can help",
  });

  async function send(event: SubmitEvent) {
    event.preventDefault();
    submitted = true;
    failure = "";
    if (Object.values(errors).some(Boolean)) return;
    phase = "sending";
    try {
      await onSubmit?.({ name: values.name.trim(), email: values.email.trim(), topic, message: values.message.trim() });
      phase = "sent";
    } catch (error) {
      phase = "editing";
      failure = error instanceof Error && error.message ? error.message : "We couldn't send that. Your message is kept, so try again.";
    }
  }
  function again() {
    values = { name: "", email: "", message: "" };
    submitted = false;
    phase = "editing";
  }

  // svelte-ignore state_referenced_locally
  let channel = $state(channels[0]?.value ?? "");
  const active = $derived(channels.find((entry) => entry.value === channel));
  let done = $state<string | null>(null);
  let copied = $state<string | null>(null);
  async function copyValue(value: string) {
    await navigator.clipboard?.writeText(value);
    copied = value;
    setTimeout(() => (copied = null), 1500);
  }

  let now = $state(new Date());
  $effect(() => {
    const timer = setInterval(() => (now = new Date()), 30_000);
    return () => clearInterval(timer);
  });
  function clock(office: ContactOffice) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: office.timeZone, hour: "numeric", minute: "2-digit", hour12: false, weekday: "short" }).formatToParts(now);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    const hour = Number(get("hour")) % 24;
    const [from, to] = office.hours ?? [9, 18];
    return { time: `${get("hour")}:${get("minute")}`, open: !["Sat", "Sun"].includes(get("weekday")) && hour >= from && hour < to };
  }
</script>

<section class="mc-contact">
  <h2 class={["mc-contact__title", classNames?.title]}>{title ?? text.title}</h2>
  <p class={["mc-contact__description", classNames?.description]}>{description ?? text.description}</p>

  {#if variant === "form"}
    {#if phase === "sent"}
      <div class="mc-contact__sent" role="status">
        <h3>Message sent</h3>
        <p>Thanks {values.name.trim().split(/\s+/)[0]}. We will reply to {values.email.trim()} within one business day.</p>
        <Button variant="secondary" onclick={again}>Send another</Button>
      </div>
    {:else}
      <form class="mc-contact__form" novalidate onsubmit={send}>
        <SegmentedControl bind:value={() => topic, (next) => (topic = next ?? topic)} label="Topic" options={topics.map((entry) => ({ value: entry, label: entry }))} />
        <Input bind:value={values.name} label="Name" name="name" autocomplete="name" error={submitted ? errors.name : ""} />
        <Input bind:value={values.email} label="Email" name="email" type="email" inputmode="email" autocomplete="email" error={submitted ? errors.email : ""} />
        <Textarea bind:value={values.message} label="Message" name="message" maxlength={MAX_MESSAGE} description="{values.message.length} / {MAX_MESSAGE}" error={submitted ? errors.message : ""} />
        {#if failure}<p role="alert" class="mc-contact__failure">{failure}</p>{/if}
        <Button type="submit" loading={phase === "sending"}>Send message</Button>
      </form>
    {/if}
  {:else if variant === "channels"}
    <div class="mc-contact__channels" role="radiogroup" aria-label="Contact channel">
      {#each channels as entry (entry.value)}
        <button type="button" role="radio" aria-checked={entry.value === channel} class={["mc-contact__card", classNames?.card]} onclick={() => (channel = entry.value)}>
          <strong>{entry.label}</strong><small>{entry.meta}</small>
        </button>
      {/each}
    </div>
    {#if active}
      <div class="mc-contact__detail">
        <p>{active.detail}</p>
        {#if active.copyValue}
          <p class="mc-contact__copy"><span>{active.copyValue}</span><Button variant="ghost" size="sm" onclick={() => copyValue(active.copyValue!)}>{copied === active.copyValue ? "Copied" : "Copy"}</Button></p>
        {/if}
        {#if active.action}
          <Button onclick={() => (done = done === active.value ? null : active.value)}>{done === active.value ? `✓ ${active.action.doneLabel}` : active.action.label}</Button>
        {/if}
      </div>
    {/if}
  {:else}
    <ul class="mc-contact__offices">
      {#each offices as office (office.city)}
        <li class={["mc-contact__card", classNames?.card]}>
          <strong>{office.city}</strong>
          <span class="mc-contact__clock">{clock(office).time} <em data-open={clock(office).open || undefined}>{clock(office).open ? "Open now" : "Closed"}</em></span>
          <address>{#each office.address as line (line)}<span>{line}</span>{/each}</address>
          {#if office.email}<a href="mailto:{office.email}">{office.email}</a>{/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-contact { display: grid; gap: 16px; max-width: 640px; color: var(--foreground); }
.mc-contact__title { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -.04em; }
.mc-contact__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-contact__form, .mc-contact__sent { display: grid; gap: 14px; }
.mc-contact__failure { margin: 0; color: var(--danger); font-size: var(--text-sm); }
.mc-contact__channels, .mc-contact__offices { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.mc-contact__offices { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.mc-contact__card { display: grid; gap: 4px; border: 1px solid var(--border); border-radius: 20px; padding: 14px; background: var(--surface); color: inherit; font: inherit; text-align: start; }
button.mc-contact__card { cursor: pointer; }
.mc-contact__card[aria-checked="true"] { border-color: var(--foreground); }
.mc-contact__card small, .mc-contact__card address { color: var(--text-muted); font-size: var(--text-xs); font-style: normal; display: grid; }
.mc-contact__detail { display: grid; gap: 10px; justify-items: start; border: 1px solid var(--border); border-radius: 20px; padding: 16px; background: var(--surface-muted); }
.mc-contact__detail p { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-contact__copy { display: flex; align-items: center; gap: 8px; }
.mc-contact__clock { font-variant-numeric: tabular-nums; }
.mc-contact__clock em { margin-inline-start: 6px; color: var(--text-muted); font-style: normal; }
.mc-contact__clock em[data-open] { color: var(--success); }
}
</style>
