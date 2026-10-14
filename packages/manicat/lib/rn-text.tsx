// @manicat-dependencies react-native
import { forwardRef, useEffect, useState } from "react";
import { Animated, Platform, StyleSheet, Text as NativeText, TextInput as NativeTextInput } from "react-native";
import type { TextInputProps, TextProps, TextStyle } from "react-native";

/**
 * The typefaces of Manicat UI on React Native: Inter for text and Geist for display, as on the web (`--font-body`, `--font-display`).
 * On the web (react-native-web) the variable fonts are used with a real `fontWeight`. On a device, React Native cannot pick a weight from
 * a variable font, so each weight is its own family; load them once with `useManicatFonts()`.
 */
const families = {
  body: { web: '"Inter Variable", Inter, system-ui, sans-serif', native: { 400: "Inter_400Regular", 500: "Inter_500Medium", 600: "Inter_600SemiBold", 700: "Inter_700Bold" }, tracking: 0 },
  display: { web: '"Geist Variable", Geist, system-ui, sans-serif', native: { 400: "Geist_400Regular", 500: "Geist_500Medium", 600: "Geist_600SemiBold", 700: "Geist_700Bold" }, tracking: -0.03 },
} as const;

export type ManicatFont = keyof typeof families;

/** A style may name `fontFamily: "display"`; any other family (a monospace, say) is left alone. */
export function fontStyle(style: TextStyle | undefined): TextStyle {
  const flat = style ?? {};
  const family = flat.fontFamily;
  const key: ManicatFont | null = family === undefined || family === "body" ? "body" : family === "display" ? "display" : null;
  if (!key) return flat;
  const set = families[key];
  const weight = Number(flat.fontWeight ?? 400) || 400;
  const size = typeof flat.fontSize === "number" ? flat.fontSize : 14;
  const tracking = flat.letterSpacing ?? size * set.tracking;
  const leading = flat.lineHeight ?? Math.round(size * (key === "display" ? 1.1 : 1.4) * 100) / 100;
  if (Platform.OS === "web") return { ...flat, fontFamily: set.web, letterSpacing: tracking, lineHeight: leading };
  const pick = (weight <= 400 ? 400 : weight <= 500 ? 500 : weight <= 600 ? 600 : 700) as 400 | 500 | 600 | 700;
  return { ...flat, fontFamily: set.native[pick], fontWeight: undefined, letterSpacing: tracking, lineHeight: leading };
}

const styled = (style: TextProps["style"]) => fontStyle(StyleSheet.flatten(style) as TextStyle | undefined);

/** `Text` with the Manicat typefaces and tracking applied. Pass `fontFamily: "display"` for the display face. */
export const Text = forwardRef<NativeText, TextProps>(function Text({ style, ...props }, ref) {
  return <NativeText ref={ref} {...props} style={styled(style)} />;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function TextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={styled(style)} />;
});
export type TextInput = NativeTextInput;

export const AnimatedText = Animated.createAnimatedComponent(Text);

let loading: Promise<void> | null = null;
/**
 * Loads Inter and Geist on a device with `expo-font` and the `@expo-google-fonts` packages (install `expo-font`, `@expo-google-fonts/inter`
 * and `@expo-google-fonts/geist`). Returns true once the fonts are usable; render a splash until then. On the web it is true at once.
 */
export function useManicatFonts() {
  const [ready, setReady] = useState(Platform.OS === "web");
  useEffect(() => {
    if (ready) return;
    loading ??= (async () => {
      try {
        const { loadAsync } = require("expo-font");
        const inter = require("@expo-google-fonts/inter");
        const geist = require("@expo-google-fonts/geist");
        await loadAsync(Object.fromEntries([...["400Regular", "500Medium", "600SemiBold", "700Bold"].map((name) => [`Inter_${name}`, inter[`Inter_${name}`]]), ...["400Regular", "500Medium", "600SemiBold", "700Bold"].map((name) => [`Geist_${name}`, geist[`Geist_${name}`]])]));
      } catch {
        // Without the font packages the system font is used.
      }
    })();
    void loading.then(() => setReady(true));
  }, [ready]);
  return ready;
}
