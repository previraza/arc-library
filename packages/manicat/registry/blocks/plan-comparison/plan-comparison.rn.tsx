import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { SegmentedControl } from "@/registry/components/segmented-control/segmented-control.rn";
import { Switch } from "@/registry/components/switch/switch.rn";
import { useTokens } from "@/lib/rn-tokens";

type Plan = "team" | "studio";
type Billing = "monthly" | "yearly";
type Feature = { label: string; team: string; studio: string; shared?: boolean };

const features: Feature[] = [
  { label: "Active projects", team: "Unlimited", studio: "Unlimited", shared: true },
  { label: "Shared workspaces", team: "1 workspace", studio: "Unlimited" },
  { label: "Guest reviewers", team: "5 per project", studio: "Unlimited" },
  { label: "Version history", team: "30 days", studio: "Unlimited" },
  { label: "Approval flows", team: "Not included", studio: "Included" },
  { label: "Custom roles", team: "Not included", studio: "Included" },
  { label: "Source exports", team: "Included", studio: "Included", shared: true },
  { label: "Support", team: "Email", studio: "Priority email" },
];

const pricing: Record<Plan, Record<Billing, number>> = {
  team: { monthly: 13, yearly: 10 },
  studio: { monthly: 27, yearly: 22 },
};
const names: Record<Plan, string> = { team: "Team", studio: "Studio" };
const taglines: Record<Plan, string> = { team: "For smaller teams", studio: "For work across teams" };

export interface PlanComparisonProps extends ViewProps {
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: {
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    plan?: StyleProp<ViewStyle>;
    row?: StyleProp<ViewStyle>;
  };
}

export function PlanComparison({ style, styles: parts, ...props }: PlanComparisonProps) {
  const tokens = useTokens();
  const [billing, setBilling] = useState<Billing>("monthly");
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [selected, setSelected] = useState<Plan | null>(null);
  const visible = differencesOnly ? features.filter((feature) => !feature.shared) : features;

  return (
    <View {...props} accessibilityRole="summary" style={[local.root, style]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>Room for the way you work</Text>
      <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>Only the details that change between plans. Switch billing to see what you would pay.</Text>
      <SegmentedControl label="Billing period" value={billing} onValueChange={(value) => setBilling(value as Billing)} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} />
      <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{billing === "yearly" ? "Billed yearly, save up to 23%" : "Billed month to month"}</Text>

      <View style={local.plans}>
        {(["team", "studio"] as const).map((plan) => (
          <View key={plan} style={[local.plan, { borderColor: selected === plan ? tokens.foreground : tokens.border, backgroundColor: tokens.surface }, parts?.plan]}>
            <Text style={{ color: tokens.foreground, fontWeight: "600", fontSize: 16 }}>{names[plan]}</Text>
            <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{taglines[plan]}</Text>
            <Text accessibilityLiveRegion="polite" style={{ color: tokens.foreground, fontSize: 28, fontWeight: "600" }}>${pricing[plan][billing]}</Text>
            <Text style={{ color: tokens.textMuted, fontSize: 12 }}>per seat / month</Text>
            <Button variant={selected === plan ? "primary" : "secondary"} size="sm" accessibilityState={{ selected: selected === plan }} onPress={() => setSelected((current) => (current === plan ? null : plan))}>
              {selected === plan ? "Selected" : `Select ${names[plan]}`}
            </Button>
          </View>
        ))}
      </View>

      <View style={local.filter}>
        <Text style={{ color: tokens.textSecondary, fontSize: 13 }}>{visible.length} of {features.length} features</Text>
        <Switch checked={differencesOnly} onCheckedChange={setDifferencesOnly} label="Show differences only" />
      </View>

      <View style={{ borderTopWidth: 1, borderColor: tokens.border }}>
        {visible.map((feature) => (
          <View key={feature.label} style={[local.row, { borderColor: tokens.border }, parts?.row]}>
            <Text style={{ color: tokens.foreground, fontWeight: "500", fontSize: 14 }}>{feature.label}</Text>
            {(["team", "studio"] as const).map((plan) => (
              <View key={plan} style={local.value}>
                <Text style={{ color: tokens.textMuted, fontSize: 12 }}>{names[plan]}</Text>
                <Text style={{ color: feature[plan] === "Not included" ? tokens.textMuted : feature[plan] === "Included" ? tokens.success : tokens.foreground, fontSize: 14 }}>
                  {feature[plan] === "Included" ? "✓ Included" : feature[plan]}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      <Text style={{ color: tokens.textMuted, fontSize: 12 }}>Prices in USD per seat. Yearly plans are billed annually.</Text>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  description: { fontSize: 14, lineHeight: 21 },
  plans: { flexDirection: "row", gap: 12 },
  plan: { flex: 1, gap: 4, borderWidth: 1, borderRadius: 20, padding: 14 },
  filter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { gap: 6, paddingVertical: 12, borderBottomWidth: 1 },
  value: { flexDirection: "row", justifyContent: "space-between" },
});

export default PlanComparison;
