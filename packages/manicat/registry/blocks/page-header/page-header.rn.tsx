// @manicat-dependencies lucide-react-native react-native-svg
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { AvatarGroup } from "@/registry/components/avatar-group/avatar-group.rn";
import { Badge } from "@/registry/components/badge/badge.rn";
import { Button } from "@/registry/components/button/button.rn";
import { Progress } from "@/registry/components/progress/progress.rn";
import { SegmentedControl } from "@/registry/components/segmented-control/segmented-control.rn";
import { useTokens } from "@/lib/rn-tokens";
import { Circle } from "lucide-react-native";

type Section = "overview" | "issues" | "updates" | "files";
export type PageHeaderIssue = { id: string; title: string; owner: string; label: string };
export type PageHeaderUpdate = { id: string; author: string; date: string; tone: "success" | "warning"; status: string; body: string };
export type PageHeaderMilestone = { name: string; note: string; state: "done" | "active" | "planned" };

const members = [
  { name: "Emma Collins", src: "/media/people/emma-collins.jpg" },
  { name: "Marcus Johnson", src: "/media/people/marcus-johnson.jpg" },
  { name: "Ava Mitchell", src: "/media/people/ava-mitchell.jpg" },
  { name: "Sofia Ramirez", src: "/media/people/sofia-ramirez.jpg" },
  { name: "Jasmine Brooks", src: "/media/people/jasmine-brooks.jpg" },
];
const sections: { value: Section; label: string }[] = [{ value: "overview", label: "Overview" }, { value: "issues", label: "Issues" }, { value: "updates", label: "Updates" }, { value: "files", label: "Files" }];
const startingIssues: PageHeaderIssue[] = [
  { id: "CHK-138", title: "Saved card list clips the expiry date on small screens", owner: "Sofia Ramirez", label: "Bug" },
  { id: "CHK-136", title: "Add an edit link beside each section of the review step", owner: "Emma Collins", label: "Design" },
  { id: "CHK-135", title: "Wallet sheet opens twice after a failed card check", owner: "Marcus Johnson", label: "Bug" },
  { id: "CHK-133", title: "Show the delivery estimate before payment", owner: "Ava Mitchell", label: "Research" },
  { id: "CHK-131", title: "Promo code field loses focus after an invalid code", owner: "Sofia Ramirez", label: "Bug" },
];
const updates: PageHeaderUpdate[] = [
  { id: "u3", author: "Ava Mitchell", date: "Sep 12", tone: "success", status: "On track", body: "Five usability sessions are done. People trust a single review step as long as the total stays visible while they edit." },
  { id: "u2", author: "Marcus Johnson", date: "Sep 5", tone: "warning", status: "At risk", body: "Card tokenization is waiting on the payments team. We moved the review step ahead so the October date can hold." },
  { id: "u1", author: "Emma Collins", date: "Aug 29", tone: "success", status: "On track", body: "Kickoff. Scope is saved cards, one review step, and a staged rollout starting October 14." },
];
const files = [
  { name: "Checkout flows v3", kind: "Design file", size: "18.4 MB", date: "Sep 20" },
  { name: "Payments API notes", kind: "Document", size: "96 KB", date: "Sep 16" },
  { name: "Rollout plan", kind: "Slides", size: "4.8 MB", date: "Sep 11" },
  { name: "Launch checklist", kind: "Document", size: "54 KB", date: "Sep 2" },
];
const milestones: PageHeaderMilestone[] = [
  { name: "Saved payment methods", note: "Shipped Sep 18", state: "done" },
  { name: "Single review step", note: "In progress, due Oct 1", state: "active" },
  { name: "Staged rollout", note: "Planned for Oct 14", state: "planned" },
];
const DONE_AT_START = 31;

export interface PageHeaderProps extends ViewProps {
  title?: string;
  breadcrumbs?: string[];
  /** Called when the primary action is pressed. */
  onShare?: () => void;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; tabs?: StyleProp<ViewStyle>; row?: StyleProp<ViewStyle> };
}

export function PageHeader({ title = "Checkout redesign", breadcrumbs = ["Projects", "Northline"], onShare, style, styles: parts, ...props }: PageHeaderProps) {
  const tokens = useTokens();
  const [section, setSection] = useState<Section>("overview");
  const [issues, setIssues] = useState(startingIssues);
  const [done, setDone] = useState(DONE_AT_START);
  const open = issues.length;

  return (
    <View {...props} style={[local.root, style]}>
      <Text style={{ color: tokens.textMuted, fontSize: 13 }}>{breadcrumbs.join(" / ")}</Text>
      <View style={local.titleRow}>
        <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title}</Text>
        <Badge tone="success" size="sm">On track</Badge>
      </View>
      <View style={local.titleRow}>
        <AvatarGroup members={members} max={4} size="sm" />
        <Button variant="secondary" size="sm" onPress={onShare}>Share</Button>
      </View>
      <SegmentedControl label="Project sections" value={section} onValueChange={(value) => setSection(value as Section)} options={sections.map((item) => ({ value: item.value, label: item.value === "issues" ? `Issues ${open}` : item.label }))} style={parts?.tabs} />

      {section === "overview" ? (
        <View style={{ gap: 12 }}>
          <Progress value={done} max={done + open} label={`${done} of ${done + open} issues done`} showValue />
          <Text accessibilityRole="header" style={[local.heading, { color: tokens.foreground }]}>Milestones</Text>
          {milestones.map((item) => (
            <View key={item.name} style={local.line}>
              <Text style={{ color: item.state === "done" ? tokens.success : tokens.textMuted }}>{item.state === "done" ? "●" : item.state === "active" ? "◐" : "○"}</Text>
              <Text style={{ color: tokens.foreground, flex: 1 }}>{item.name}</Text>
              <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{item.note}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {section === "issues" ? (
        <View style={{ gap: 4 }}>
          {issues.length === 0 ? <Text style={{ color: tokens.textSecondary }}>Nothing left to do.</Text> : null}
          {issues.map((issue) => (
            <View key={issue.id} style={[local.line, { borderBottomWidth: 1, borderColor: tokens.border, paddingVertical: 10 }, parts?.row]}>
              <Pressable accessibilityRole="checkbox" accessibilityLabel={`Mark ${issue.id} done`} accessibilityState={{ checked: false }} onPress={() => { setIssues((current) => current.filter((item) => item.id !== issue.id)); setDone((value) => value + 1); }}>
                <Circle size={16} strokeWidth={1.75} color={tokens.textMuted} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: tokens.textMuted, fontSize: 11 }}>{issue.id} · {issue.label} · {issue.owner}</Text>
                <Text style={{ color: tokens.foreground, fontSize: 14 }}>{issue.title}</Text>
              </View>
            </View>
          ))}
          <Button variant="ghost" size="sm" onPress={() => { setIssues(startingIssues); setDone(DONE_AT_START); }}>Reset</Button>
        </View>
      ) : null}
      {section === "updates" ? updates.map((update) => (
        <View key={update.id} style={{ gap: 4 }}>
          <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{update.author} · {update.date} · <Text style={{ color: update.tone === "success" ? tokens.success : tokens.warning }}>{update.status}</Text></Text>
          <Text style={{ color: tokens.textSecondary, fontSize: 14, lineHeight: 21 }}>{update.body}</Text>
        </View>
      )) : null}
      {section === "files" ? files.map((file) => (
        <View key={file.name} style={[local.line, { justifyContent: "space-between" }]}>
          <View><Text style={{ color: tokens.foreground }}>{file.name}</Text><Text style={{ color: tokens.textMuted, fontSize: 12 }}>{file.kind} · {file.size}</Text></View>
          <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{file.date}</Text>
        </View>
      )) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 26, fontWeight: "600", letterSpacing: -0.5 },
  heading: { fontSize: 15, fontWeight: "600" },
  line: { flexDirection: "row", alignItems: "center", gap: 10 },
});

export default PageHeader;
