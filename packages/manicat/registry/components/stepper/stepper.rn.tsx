import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type StepperStatus = "complete" | "current" | "upcoming" | "error";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  error?: string;
}

export interface StepperProps extends Omit<ViewProps, "children"> {
  steps: StepperStep[];
  /** Index of the current step. A value equal to the number of steps means every step is complete. */
  current: number;
  onStepSelect?: (index: number) => void;
  details?: "all" | "current";
  label?: string;
  /** Extend the inner, named parts of the stepper: step, marker, markerText, label, description or line. The React Native counterpart of `classNames`. */
  styles?: {
    step?: StyleProp<ViewStyle>;
    marker?: StyleProp<ViewStyle>;
    markerText?: StyleProp<TextStyle>;
    label?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    line?: StyleProp<ViewStyle>;
  };
}

/** Always vertical on a phone, where a horizontal row of labels rarely fits. */
export function Stepper({ steps, current, onStepSelect, details = "all", label = "Progress", style, styles: parts, ...props }: StepperProps) {
  const tokens = useTokens();

  return (
    <View {...props} accessibilityRole="list" accessibilityLabel={label} style={[{ alignSelf: "stretch" }, style]}>
      {steps.map((step, index) => {
        const status: StepperStatus = step.error ? "error" : index < current ? "complete" : index === current ? "current" : "upcoming";
        const color = status === "error" ? tokens.danger : status === "complete" ? tokens.controlOn : status === "current" ? tokens.foreground : tokens.borderStrong;
        const filled = status === "complete" || status === "error";
        const last = index === steps.length - 1;
        const showDetails = details === "all" || status === "current" || status === "error";
        const selectable = onStepSelect && (status === "complete" || status === "current");

        return (
          <Pressable
            key={step.id}
            accessibilityRole="button"
            accessibilityLabel={`${step.label}, ${status}`}
            accessibilityState={{ selected: status === "current", disabled: !selectable }}
            disabled={!selectable}
            onPress={() => onStepSelect?.(index)}
            style={[local.step, parts?.step]}
          >
            <View style={local.rail}>
              <View style={[local.marker, { borderColor: color, backgroundColor: filled ? color : tokens.surface }, parts?.marker]}>
                <Text style={[{ color: filled ? tokens.controlThumbOn : color, fontSize: 12, fontWeight: "600" }, parts?.markerText]}>{status === "complete" ? "✓" : status === "error" ? "!" : index + 1}</Text>
              </View>
              {last ? null : <View style={[local.line, { backgroundColor: index < current ? tokens.controlOn : tokens.border }, parts?.line]} />}
            </View>
            <View style={local.copy}>
              <Text style={[{ color: status === "upcoming" ? tokens.textMuted : tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.label]}>{step.label}</Text>
              {showDetails && (step.error ?? step.description) ? (
                <Text style={[{ color: status === "error" ? tokens.danger : tokens.textSecondary, fontSize: metrics.text.xs }, parts?.description]}>{step.error ?? step.description}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  step: { flexDirection: "row", gap: metrics.space[3], minHeight: 52 },
  rail: { alignItems: "center" },
  marker: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  line: { flex: 1, width: 2, marginVertical: 4, borderRadius: 1 },
  copy: { flex: 1, gap: 2, paddingTop: 3, paddingBottom: metrics.space[3] },
});

export default Stepper;
