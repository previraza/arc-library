import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { Input } from "@/registry/components/input/input.rn";
import { SegmentedControl } from "@/registry/components/segmented-control/segmented-control.rn";
import { Textarea } from "@/registry/components/textarea/textarea.rn";
import { useTokens } from "@/lib/rn-tokens";

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
  /** The action button of the detail. Pressing it confirms in place. */
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

export const contactExampleChannels: ContactChannel[] = [
  { value: "chat", label: "Chat with support", meta: "Replies in about 4 minutes", detail: "Hannah and Jordan are online now. Chat is best for quick questions about installing, theming, or a component that misbehaves.", action: { label: "Start a chat", doneLabel: "Chat started" } },
  { value: "email", label: "Email support", meta: "Replies within a business day", detail: "Send screenshots, links, or a reproduction. Every message gets a reply from a person within one business day.", copyValue: "support@example.com" },
  { value: "sales", label: "Talk to sales", meta: "Weekdays, 9am to 6pm PT", detail: "Licensing for a larger team, invoicing, or a security review. Tyler will walk you through it on a 20 minute call.", copyValue: "+1 (415) 555-0132", action: { label: "Request a call", doneLabel: "Call requested" } },
  { value: "community", label: "Ask the community", meta: "4,200 members", detail: "Designers and engineers who ship with Manicat UI answer questions about components, theming, and motion, usually within the hour.", action: { label: "Open the forum", doneLabel: "Forum opened" } },
];
export const contactExampleOffices: ContactOffice[] = [
  { city: "San Francisco", timeZone: "America/Los_Angeles", address: ["100 Example Street, Floor 4", "San Francisco, CA 94000"], email: "sf@example.com" },
  { city: "New York", timeZone: "America/New_York", address: ["200 Sample Avenue, Suite 12", "New York, NY 10000"], email: "nyc@example.com" },
  { city: "Lisbon", timeZone: "Europe/Lisbon", address: ["Rua do Exemplo 10, 3º", "1000-000 Lisboa, Portugal"], email: "lisbon@example.com" },
];

export interface ContactSectionProps extends ViewProps {
  variant?: ContactSectionVariant;
  title?: string;
  description?: string;
  topics?: string[];
  /** Called with a valid message. Throw to keep the form and show an error; resolve to show the confirmation. */
  onSubmit?: (message: ContactMessage) => void | Promise<void>;
  channels?: ContactChannel[];
  offices?: ContactOffice[];
  /** Copies a channel's value. Pass your clipboard call, for example `Clipboard.setStringAsync`. */
  onCopy?: (value: string) => void;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; card?: StyleProp<ViewStyle> };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_MESSAGE = 500;
const copy = {
  form: { title: "Talk to our team", description: "Questions about licensing, a bug you can't pin down, or a component you wish existed. A person reads every message." },
  channels: { title: "Get help your way", description: "Pick whatever suits the question. Every channel reaches the same small team." },
  offices: { title: "Visit us", description: "We work across three time zones, so someone is usually awake. Drop by for coffee, just let us know first." },
};

function Clock({ office }: { office: ContactOffice }) {
  const tokens = useTokens();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: office.timeZone, hour: "numeric", minute: "2-digit", hour12: false, weekday: "short" }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  const [from, to] = office.hours ?? [9, 18];
  const weekend = ["Sat", "Sun"].includes(get("weekday"));
  const open = !weekend && hour >= from && hour < to;
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text style={{ color: tokens.foreground, fontVariant: ["tabular-nums"] }}>{get("hour")}:{get("minute")}</Text>
      <Text style={{ color: open ? tokens.success : tokens.textMuted }}>{open ? "Open now" : "Closed"}</Text>
    </View>
  );
}

function Form({ topics, onSubmit }: { topics: string[]; onSubmit?: ContactSectionProps["onSubmit"] }) {
  const tokens = useTokens();
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [topic, setTopic] = useState(topics[0] ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState<"editing" | "sending" | "sent">("editing");
  const [failure, setFailure] = useState("");
  const errors = {
    name: values.name.trim() ? "" : "Enter your name",
    email: !values.email.trim() ? "Enter your email address" : EMAIL.test(values.email.trim()) ? "" : "Enter an email like name@example.com",
    message: values.message.trim().length >= 20 ? "" : values.message.trim() ? "Add a little more detail, at least 20 characters" : "Tell us how we can help",
  };

  async function send() {
    setSubmitted(true);
    setFailure("");
    if (Object.values(errors).some(Boolean)) return;
    setPhase("sending");
    try {
      await onSubmit?.({ name: values.name.trim(), email: values.email.trim(), topic, message: values.message.trim() });
      setPhase("sent");
    } catch (error) {
      setPhase("editing");
      setFailure(error instanceof Error && error.message ? error.message : "We couldn't send that. Your message is kept, so try again.");
    }
  }

  if (phase === "sent") {
    return (
      <View style={{ gap: 8 }}>
        <Text accessibilityRole="header" style={{ color: tokens.foreground, fontSize: 20, fontWeight: "600" }}>Message sent</Text>
        <Text style={{ color: tokens.textSecondary }}>Thanks {values.name.trim().split(/\s+/)[0]}. We will reply to {values.email.trim()} within one business day.</Text>
        <Button variant="secondary" onPress={() => { setValues({ name: "", email: "", message: "" }); setSubmitted(false); setPhase("editing"); }}>Send another</Button>
      </View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <SegmentedControl label="Topic" value={topic} onValueChange={setTopic} options={topics.map((entry) => ({ value: entry, label: entry }))} />
      <Input label="Name" autoComplete="name" value={values.name} onChangeText={(name) => setValues((current) => ({ ...current, name }))} error={submitted ? errors.name : ""} />
      <Input label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={values.email} onChangeText={(email) => setValues((current) => ({ ...current, email }))} error={submitted ? errors.email : ""} />
      <Textarea label="Message" maxLength={MAX_MESSAGE} description={`${values.message.length} / ${MAX_MESSAGE}`} value={values.message} onChangeText={(message) => setValues((current) => ({ ...current, message }))} error={submitted ? errors.message : ""} />
      {failure ? <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{failure}</Text> : null}
      <Button loading={phase === "sending"} onPress={() => void send()}>Send message</Button>
    </View>
  );
}

export function ContactSection({ variant = "form", title, description, topics = ["Sales", "Support", "Partnerships", "Press"], onSubmit, channels = contactExampleChannels, offices = contactExampleOffices, onCopy, style, styles: parts, ...props }: ContactSectionProps) {
  const tokens = useTokens();
  const [channel, setChannel] = useState(channels[0]?.value ?? "");
  const [done, setDone] = useState<string | null>(null);
  const active = channels.find((entry) => entry.value === channel);
  const text = copy[variant];

  return (
    <View {...props} style={[local.root, style]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title ?? text.title}</Text>
      <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description ?? text.description}</Text>
      {variant === "form" ? <Form topics={topics} onSubmit={onSubmit} /> : null}
      {variant === "channels" ? (
        <>
          <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
            {channels.map((entry) => (
              <Pressable key={entry.value} accessibilityRole="radio" accessibilityState={{ selected: entry.value === channel }} onPress={() => setChannel(entry.value)} style={[local.card, { borderColor: entry.value === channel ? tokens.foreground : tokens.border, backgroundColor: tokens.surface }, parts?.card]}>
                <Text style={{ color: tokens.foreground, fontWeight: "500" }}>{entry.label}</Text>
                <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{entry.meta}</Text>
              </Pressable>
            ))}
          </View>
          {active ? (
            <View style={[local.card, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }]}>
              <Text style={{ color: tokens.textSecondary, lineHeight: 21 }}>{active.detail}</Text>
              {active.copyValue ? (
                <View style={local.copyRow}>
                  <Text style={{ color: tokens.foreground, flex: 1 }}>{active.copyValue}</Text>
                  <Button variant="ghost" size="sm" onPress={() => onCopy?.(active.copyValue ?? "")}>Copy</Button>
                </View>
              ) : null}
              {active.action ? <Button onPress={() => setDone(done === active.value ? null : active.value)}>{done === active.value ? `✓ ${active.action.doneLabel}` : active.action.label}</Button> : null}
            </View>
          ) : null}
        </>
      ) : null}
      {variant === "offices" ? offices.map((office) => (
        <View key={office.city} style={[local.card, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.card]}>
          <Text style={{ color: tokens.foreground, fontWeight: "600", fontSize: 16 }}>{office.city}</Text>
          <Clock office={office} />
          {office.address.map((line) => <Text key={line} style={{ color: tokens.textSecondary, fontSize: 13 }}>{line}</Text>)}
          {office.email ? <Text style={{ color: tokens.textMuted, fontSize: 13 }}>{office.email}</Text> : null}
        </View>
      )) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 14 },
  title: { fontSize: 26, fontWeight: "600", letterSpacing: -0.5 },
  description: { fontSize: 14, lineHeight: 21 },
  card: { gap: 6, borderWidth: 1, borderRadius: 20, padding: 14 },
  copyRow: { flexDirection: "row", alignItems: "center" },
});

export default ContactSection;
