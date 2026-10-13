import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { SearchField } from "@/registry/components/search-field/search-field.rn";
import { SegmentedControl } from "@/registry/components/segmented-control/segmented-control.rn";
import { useTokens } from "@/lib/rn-tokens";

export type FaqSectionVariant = "accordion" | "columns" | "search";
export interface FaqItem {
  id?: string;
  question: string;
  /** Plain text answer; it is also what search matches. */
  answer: string;
  category?: string;
}

export const faqExampleItems: FaqItem[] = [
  { question: "What is Manicat UI?", answer: "Manicat UI is a library of React components and blocks built on Motion and Radix. You copy the source into your project, so every line is yours to change.", category: "General" },
  { question: "Does it work with my design system?", answer: "Yes. Components read semantic tokens such as surface, border, and accent, so mapping them to your palette takes one stylesheet.", category: "General" },
  { question: "Is reduced motion supported?", answer: "Every animation has a reduced motion branch. It keeps the final state, focus, and feedback while removing travel and looping.", category: "General" },
  { question: "Which frameworks are supported?", answer: "Manicat UI targets React 19 and Next.js 16. The components are client components and also run in Vite and React Router apps.", category: "Technical" },
  { question: "How do I install a component?", answer: "Run the shadcn CLI with the component name, or copy the files by hand. Each page lists the packages it needs.", category: "Technical" },
  { question: "How do updates work?", answer: "New components and fixes ship in small releases. Run the CLI again to pull the latest version of anything you installed.", category: "Technical" },
  { question: "Can I use Manicat UI in client projects?", answer: "Yes. Free components are MIT licensed, and a Pro license covers commercial work for you or your team.", category: "Licensing" },
  { question: "What happens when my plan ends?", answer: "You keep every component you installed. Renewing only matters for new releases and updates.", category: "Licensing" },
];

export interface FaqSectionProps extends ViewProps {
  variant?: FaqSectionVariant;
  title?: string;
  description?: string;
  items?: FaqItem[];
  multiple?: boolean;
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** A way to reach a person when the answer isn't here. Pass null to hide it. */
  contact?: { label: string; description?: string; onPress?: () => void } | null;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; item?: StyleProp<ViewStyle>; question?: StyleProp<TextStyle>; answer?: StyleProp<TextStyle> };
}

const keyOf = (item: FaqItem) => item.id ?? item.question;
const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function FaqSection({ variant = "accordion", title = "Frequently asked questions", description = "Everything you need to know before you install your first component.", items = faqExampleItems, multiple = false, defaultValue, onValueChange, contact = { label: "Still have a question?", description: "Our team replies within a day." }, style, styles: parts, ...props }: FaqSectionProps) {
  const tokens = useTokens();
  const [open, setOpen] = useState<string[]>(defaultValue ?? (items[0] ? [keyOf(items[0])] : []));
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category ?? "General"))), [items]);
  const [category, setCategory] = useState(categories[0] ?? "General");
  const [query, setQuery] = useState("");

  const toggle = (key: string) => {
    const next = open.includes(key) ? open.filter((entry) => entry !== key) : multiple ? [...open, key] : [key];
    setOpen(next);
    onValueChange?.(next);
  };
  const needle = normalize(query.trim());
  const shown = variant === "columns" ? items.filter((item) => (item.category ?? "General") === category) : variant === "search" && needle ? items.filter((item) => normalize(`${item.question} ${item.answer}`).includes(needle)) : items;

  return (
    <View {...props} style={[local.root, style]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text>
      {description ? <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description}</Text> : null}
      {variant === "columns" ? <SegmentedControl label="Question topics" value={category} onValueChange={setCategory} options={categories.map((entry) => ({ value: entry, label: entry }))} /> : null}
      {variant === "search" ? (
        <>
          <SearchField label="Search questions" placeholder="Try install, license, or motion" value={query} onValueChange={setQuery} />
          <Text accessibilityLiveRegion="polite" style={{ color: tokens.textMuted, fontSize: 12 }}>{needle ? `${shown.length} ${shown.length === 1 ? "answer" : "answers"}` : `${items.length} questions`}</Text>
        </>
      ) : null}
      <View style={{ borderTopWidth: 1, borderColor: tokens.border }}>
        {shown.map((item) => {
          const isOpen = open.includes(keyOf(item));
          return (
            <View key={keyOf(item)} style={[{ borderBottomWidth: 1, borderColor: tokens.border }, parts?.item]}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => toggle(keyOf(item))} style={local.trigger}>
                <Text style={[{ flex: 1, color: tokens.foreground, fontSize: 16, fontWeight: "500" }, parts?.question]}>{item.question}</Text>
                <Text style={{ color: tokens.textMuted, fontSize: 20 }}>{isOpen ? "−" : "+"}</Text>
              </Pressable>
              {isOpen ? <Text style={[{ color: tokens.textSecondary, fontSize: 14, lineHeight: 21, paddingBottom: 16 }, parts?.answer]}>{item.answer}</Text> : null}
            </View>
          );
        })}
      </View>
      {variant === "search" && needle && shown.length === 0 ? (
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ color: tokens.textSecondary }}>No answers mention “{query.trim()}”.</Text>
          <Pressable accessibilityRole="button" onPress={() => setQuery("")}><Text style={{ color: tokens.foreground, fontWeight: "500" }}>Clear search</Text></Pressable>
        </View>
      ) : null}
      {contact ? (
        <Pressable accessibilityRole="button" onPress={contact.onPress} style={[local.contact, { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: tokens.foreground, fontWeight: "500" }}>{contact.label}</Text>
            {contact.description ? <Text style={{ color: tokens.textSecondary, fontSize: 13 }}>{contact.description}</Text> : null}
          </View>
          <Text style={{ color: tokens.foreground }}>→</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  title: { fontSize: 26, fontWeight: "600", letterSpacing: -0.5 },
  description: { fontSize: 14, lineHeight: 21 },
  trigger: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16 },
  contact: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, padding: 14 },
});

export default FaqSection;
