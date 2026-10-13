import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { SegmentedControl } from "@/registry/components/segmented-control/segmented-control.rn";
import { useTokens } from "@/lib/rn-tokens";

export type EmptyScene = "search" | "offline" | "inbox" | "map";
type Phase = "idle" | "loading" | "done";

const COPY = {
  search: {
    idle: { title: "No results for “Q3 roadmap”", line: "Two filters are on: owner is Emma Collins and status is archived.", action: "Clear filters" },
    done: { title: "12 results for “Q3 roadmap”", line: "Filters cleared. Showing matches from every owner and status.", action: "Restore filters" },
    loading: "", wait: 0, glyph: "⌕",
  },
  offline: {
    idle: { title: "You are offline", line: "Edits are saved on this device and sync when the connection returns.", action: "Try again" },
    done: { title: "Back online", line: "Three edits synced to the Northwind workspace just now.", action: "Go offline" },
    loading: "Reaching sync.northwind.example…", wait: 1400, glyph: "⌁",
  },
  inbox: {
    idle: { title: "All caught up", line: "You have read every message in Inbox. New mail lands here first.", action: "Check for mail" },
    done: { title: "Still all caught up", line: "Checked just now. Nothing new since 8:30 this morning.", action: "Check again" },
    loading: "Checking for new mail…", wait: 1100, glyph: "✓",
  },
  map: {
    idle: { title: "Page not found", line: "The link to /projects/atlas-2023 is broken, or the page has moved.", action: "Find the page" },
    done: { title: "Found it in Archive", line: "Atlas 2023 roadmap moved to /archive/atlas-2023 in March.", action: "Show broken link" },
    loading: "Searching the workspace for Atlas…", wait: 1200, glyph: "?",
  },
};
const SCENES = [
  { value: "search", label: "No results" },
  { value: "offline", label: "Offline" },
  { value: "inbox", label: "Caught up" },
  { value: "map", label: "Not found" },
];

export interface EmptyStatesProps extends ViewProps {
  /** Scene shown first. Defaults to "search". */
  defaultScene?: EmptyScene;
  /** Called when a scene's primary action finishes. */
  onAction?: (scene: EmptyScene, phase: Phase) => void;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { art?: StyleProp<ViewStyle>; glyph?: StyleProp<TextStyle>; title?: StyleProp<TextStyle>; line?: StyleProp<TextStyle> };
}

export function EmptyStates({ defaultScene = "search", onAction, style, styles: parts, ...props }: EmptyStatesProps) {
  const tokens = useTokens();
  const [scene, setScene] = useState<EmptyScene>(defaultScene);
  const [phase, setPhase] = useState<Phase>("idle");
  const entry = COPY[scene];
  const copy = phase === "done" ? entry.done : entry.idle;

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => { setPhase("done"); onAction?.(scene, "done"); }, entry.wait);
    return () => clearTimeout(timer);
  }, [phase, entry.wait, scene, onAction]);

  function act() {
    if (phase === "loading") return;
    if (phase === "done") return setPhase("idle");
    if (entry.wait === 0) { setPhase("done"); onAction?.(scene, "done"); } else setPhase("loading");
  }

  return (
    <View {...props} accessibilityLabel="Empty states" style={[local.root, style]}>
      <SegmentedControl label="Empty state" value={scene} onValueChange={(next) => { setScene(next as EmptyScene); setPhase("idle"); }} options={SCENES} />
      <View style={[local.art, { backgroundColor: tokens.surfaceMuted, borderColor: tokens.border }, parts?.art]}>
        <Text accessibilityElementsHidden style={[{ color: phase === "done" ? tokens.success : tokens.textMuted, fontSize: 64 }, parts?.glyph]}>{entry.glyph}</Text>
      </View>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{copy.title}</Text>
      <Text accessibilityLiveRegion="polite" style={[local.line, { color: tokens.textSecondary }, parts?.line]}>{phase === "loading" ? entry.loading : copy.line}</Text>
      <Button size="sm" loading={phase === "loading"} onPress={act}>{copy.action}</Button>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 14, alignItems: "center" },
  art: { alignSelf: "stretch", alignItems: "center", justifyContent: "center", height: 160, borderWidth: 1, borderRadius: 28 },
  title: { fontSize: 20, fontWeight: "600", letterSpacing: -0.3, textAlign: "center" },
  line: { fontSize: 14, lineHeight: 21, textAlign: "center" },
});

export default EmptyStates;
