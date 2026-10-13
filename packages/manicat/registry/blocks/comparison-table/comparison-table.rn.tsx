import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { Switch } from "@/registry/components/switch/switch.rn";
import { useTokens } from "@/lib/rn-tokens";

export type ComparisonValue = boolean | "partial" | string | { value: boolean | "partial" | string; note?: string };
export type ComparisonColumn = { id: string; name: string; caption?: string; highlight?: boolean };
export type ComparisonRow = { id: string; feature: string; hint?: string; values: Record<string, ComparisonValue> };
export type ComparisonSection = { id: string; title: string; rows: ComparisonRow[] };

const comparisonColumns: ComparisonColumn[] = [
  { id: "relay", name: "Relay", caption: "$10 per seat", highlight: true },
  { id: "suite", name: "Legacy suite", caption: "$24 per seat" },
  { id: "sheets", name: "Spreadsheets", caption: "Free" },
  { id: "point", name: "Point tools", caption: "$16 per seat" },
];

const comparisonSections: ComparisonSection[] = [
  {
    id: "planning", title: "Planning", rows: [
      { id: "projects", feature: "Projects", values: { relay: "Unlimited", suite: "Up to 50", sheets: "Unlimited", point: "Up to 10" } },
      { id: "roadmaps", feature: "Timelines and roadmaps", values: { relay: true, suite: true, sheets: false, point: { value: "partial", note: "Timeline only" } } },
      { id: "dependencies", feature: "Dependencies", hint: "Blocked work moves when its blocker does", values: { relay: true, suite: true, sheets: false, point: false } },
      { id: "templates", feature: "Templates", values: { relay: true, suite: true, sheets: { value: "partial", note: "Manual copies" }, point: true } },
    ],
  },
  {
    id: "collaboration", title: "Collaboration", rows: [
      { id: "realtime", feature: "Real time editing", values: { relay: true, suite: false, sheets: true, point: true } },
      { id: "guests", feature: "Free guest access", values: { relay: true, suite: false, sheets: true, point: { value: "partial", note: "Five guests" } } },
      { id: "comments", feature: "Comments and mentions", values: { relay: true, suite: true, sheets: true, point: true } },
      { id: "offline", feature: "Offline mode", hint: "Edits sync when you reconnect", values: { relay: true, suite: false, sheets: { value: "partial", note: "Desktop app only" }, point: false } },
    ],
  },
  {
    id: "automation", title: "Automation", rows: [
      { id: "rules", feature: "Rules and triggers", values: { relay: true, suite: true, sheets: false, point: { value: "partial", note: "Paid add on" } } },
      { id: "ai", feature: "AI summaries", values: { relay: true, suite: false, sheets: false, point: false } },
      { id: "api", feature: "Public API", values: { relay: true, suite: true, sheets: true, point: true } },
    ],
  },
  {
    id: "security", title: "Security", rows: [
      { id: "sso", feature: "SAML single sign on", values: { relay: true, suite: true, sheets: { value: "partial", note: "Enterprise plan" }, point: false } },
      { id: "audit", feature: "Audit log", values: { relay: true, suite: true, sheets: false, point: false } },
      { id: "residency", feature: "EU data residency", values: { relay: true, suite: { value: "partial", note: "Enterprise plan" }, sheets: true, point: false } },
    ],
  },
];

export interface ComparisonTableProps extends ViewProps {
  title?: string;
  description?: string;
  columns?: ComparisonColumn[];
  sections?: ComparisonSection[];
  defaultDifferencesOnly?: boolean;
  /** Call to action under your column. */
  cta?: { label: string; onPress?: () => void; doneLabel?: string };
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; section?: StyleProp<TextStyle>; row?: StyleProp<ViewStyle>; feature?: StyleProp<TextStyle> };
}

function normalize(value: ComparisonValue | undefined) {
  if (value === undefined) return { value: false as const, note: undefined };
  if (typeof value === "object") return value;
  return { value, note: undefined };
}

export function ComparisonTable({
  title = "How Relay compares",
  description = "Everything a growing team needs, without the enterprise price or the spreadsheet sprawl.",
  columns = comparisonColumns,
  sections = comparisonSections,
  defaultDifferencesOnly = false,
  cta,
  style,
  styles: parts,
  ...props
}: ComparisonTableProps) {
  const tokens = useTokens();
  const [differencesOnly, setDifferencesOnly] = useState(defaultDifferencesOnly);
  const own = columns.find((column) => column.highlight) ?? columns[0];
  const others = columns.filter((column) => column !== own);
  // Phones stack the table into a two column comparison: yours beside one competitor.
  const [compareWith, setCompareWith] = useState(others[0]?.id ?? own.id);
  const [done, setDone] = useState(false);
  const visible = [own, ...columns.filter((column) => column.id === compareWith && column !== own)];
  const differs = (values: Record<string, ComparisonValue>) => new Set(visible.map((column) => JSON.stringify(normalize(values[column.id]).value))).size > 1;

  const mark = (value: ComparisonValue | undefined, color: string) => {
    const { value: v, note } = normalize(value);
    if (typeof v === "string" && v !== "partial") return <Text style={{ color: tokens.foreground, fontSize: 13, textAlign: "center" }}>{v}</Text>;
    return (
      <View style={{ alignItems: "center" }}>
        <Text accessibilityLabel={v === true ? "Included" : v === "partial" ? "Partial" : "Not included"} style={{ color: v === false ? tokens.textMuted : color, fontSize: 18 }}>{v === true ? "✓" : v === "partial" ? "◐" : "–"}</Text>
        {note ? <Text style={{ color: tokens.textMuted, fontSize: 11, textAlign: "center" }}>{note}</Text> : null}
      </View>
    );
  };

  return (
    <View {...props} style={[local.root, style]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text>
      {description ? <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description}</Text> : null}
      <Switch checked={differencesOnly} onCheckedChange={setDifferencesOnly} label="Only differences" />
      {others.length > 1 ? (
        <View accessibilityRole="radiogroup" style={local.picker}>
          {others.map((column) => (
            <Pressable key={column.id} accessibilityRole="radio" accessibilityState={{ selected: column.id === compareWith }} onPress={() => setCompareWith(column.id)} style={[local.pick, { borderColor: column.id === compareWith ? tokens.foreground : tokens.border, backgroundColor: column.id === compareWith ? tokens.surfaceMuted : "transparent" }]}>
              <Text style={{ color: tokens.foreground, fontSize: 13 }}>{column.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={local.line}>
        <View style={{ flex: 1.3 }} />
        {visible.map((column) => (
          <View key={column.id} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: tokens.foreground, fontWeight: "600", fontSize: 14 }}>{column.name}</Text>
            {column.caption ? <Text style={{ color: tokens.textMuted, fontSize: 11 }}>{column.caption}</Text> : null}
          </View>
        ))}
      </View>
      {sections.map((section) => {
        const rows = differencesOnly ? section.rows.filter((row) => differs(row.values)) : section.rows;
        if (!rows.length) return null;
        return (
          <View key={section.id}>
            <Text style={[local.section, { color: tokens.textMuted }, parts?.section]}>{section.title}</Text>
            {rows.map((row) => (
              <View key={row.id} style={[local.line, { borderTopWidth: 1, borderColor: tokens.border }, parts?.row]}>
                <View style={{ flex: 1.3 }}>
                  <Text style={[{ color: tokens.foreground, fontSize: 14 }, parts?.feature]}>{row.feature}</Text>
                  {row.hint ? <Text style={{ color: tokens.textMuted, fontSize: 11 }}>{row.hint}</Text> : null}
                </View>
                {visible.map((column) => <View key={column.id} style={{ flex: 1 }}>{mark(row.values[column.id], column === own ? tokens.success : tokens.foreground)}</View>)}
              </View>
            ))}
          </View>
        );
      })}
      {cta ? <Button variant="primary" onPress={() => { cta.onPress?.(); if (cta.doneLabel) setDone(true); }}>{done ? `✓ ${cta.doneLabel}` : cta.label}</Button> : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  title: { fontSize: 26, fontWeight: "600", letterSpacing: -0.5 },
  description: { fontSize: 14, lineHeight: 21 },
  picker: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pick: { borderWidth: 1, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  line: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  section: { marginTop: 8, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" },
});

export default ComparisonTable;
