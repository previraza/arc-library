import { useColorScheme } from "react-native";

/** The Manicat UI design tokens as React Native values. Same names and meaning as registry/foundation.css. */
export interface ManicatTokens {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  foreground: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  accent: string;
  accentStrong: string;
  accentSubtle: string;
  accentForeground: string;
  success: string;
  warning: string;
  danger: string;
  controlOn: string;
  /** The check or dot drawn on a chosen control. */
  controlGlyph: string;
  /** Slider fills. */
  controlFill: string;
  controlTrack: string;
  controlThumb: string;
  controlThumbOn: string;
  /** Four distinguishable colours for chart series, the counterpart of --series-1 to --series-4. */
  series: [string, string, string, string];
}

// <generated> by scripts/gen-rn-tokens.mjs from registry/foundation.css. Do not edit by hand.
export const lightTokens: ManicatTokens = {
  background: "#ffffff",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  surfaceMuted: "#f8f8f8",
  foreground: "#0b0b0b",
  textSecondary: "#585858",
  textMuted: "#7d7d7d",
  border: "#e9e9e9",
  borderSubtle: "#f3f3f3",
  borderStrong: "#c4c4c4",
  accent: "#353535",
  accentStrong: "#1f1f1f",
  accentSubtle: "rgba(53, 53, 53, 0.1)",
  accentForeground: "#ffffff",
  success: "#007b12",
  warning: "#b66400",
  danger: "#cd1526",
  controlOn: "#1d1d1d",
  controlGlyph: "#ffffff",
  controlTrack: "#dcdcdc",
  controlThumb: "#ffffff",
  controlThumbOn: "#ffffff",
  controlFill: "#1d1d1d",
  series: ["#1f7dcf", "#7128a5", "#e58f00", "#009e84"],
};

export const darkTokens: ManicatTokens = {
  background: "#141414",
  surface: "#191919",
  surfaceRaised: "#1f1f1f",
  surfaceMuted: "#242424",
  foreground: "#f2f2f2",
  textSecondary: "#b4b4b4",
  textMuted: "#8c8c8c",
  border: "#2b2b2b",
  borderSubtle: "#222222",
  borderStrong: "#484848",
  accent: "#bebebe",
  accentStrong: "#e1e1e1",
  accentSubtle: "rgba(190, 190, 190, 0.13)",
  accentForeground: "#141414",
  success: "#4cd676",
  warning: "#ffb90e",
  danger: "#ff736d",
  controlOn: "#e8e8e8",
  controlGlyph: "#141414",
  controlTrack: "#353535",
  controlThumb: "#f5f5f5",
  controlThumbOn: "#141414",
  controlFill: "#868686",
  series: ["#55adff", "#9c37be", "#e66e00", "#00a861"],
};

/** The accent presets of foundation.css: the tokens each one changes, per theme. Spread one over the base tokens to rebrand. */
export const accents = {
  neutral: { light: { accent: "#353535", accentStrong: "#1f1f1f", accentSubtle: "rgba(53, 53, 53, 0.1)", accentForeground: "#ffffff", controlOn: "#1d1d1d", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#1d1d1d" }, dark: { accent: "#bebebe", accentStrong: "#e1e1e1", accentSubtle: "rgba(190, 190, 190, 0.13)", accentForeground: "#141414", controlOn: "#e8e8e8", controlGlyph: "#141414", controlThumbOn: "#141414", controlFill: "#868686" } },
  violet: { light: { accent: "#7747ff", accentStrong: "#5528ce", accentSubtle: "rgba(119, 71, 255, 0.13)", accentForeground: "#ffffff", controlOn: "#7747ff", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#7747ff" }, dark: { accent: "#a78bff", accentStrong: "#c7b7ff", accentSubtle: "rgba(119, 71, 255, 0.22)", accentForeground: "#141414", controlOn: "#8a66ff", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#8a66ff" } },
  blue: { light: { accent: "#0562ef", accentStrong: "#074db7", accentSubtle: "rgba(5, 98, 239, 0.12)", accentForeground: "#ffffff", controlOn: "#0562ef", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#0562ef" }, dark: { accent: "#6ba3ff", accentStrong: "#a4c7ff", accentSubtle: "rgba(5, 98, 239, 0.22)", accentForeground: "#141414", controlOn: "#3b82f6", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#3b82f6" } },
  green: { light: { accent: "#0db879", accentStrong: "#087c54", accentSubtle: "rgba(13, 184, 121, 0.13)", accentForeground: "#102016", controlOn: "#10a870", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#10a870" }, dark: { accent: "#53dca6", accentStrong: "#93efd0", accentSubtle: "rgba(13, 184, 121, 0.2)", accentForeground: "#102016", controlOn: "#1fae78", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#1fae78" } },
  amber: { light: { accent: "#f3ad20", accentStrong: "#9c6300", accentSubtle: "rgba(243, 173, 32, 0.16)", accentForeground: "#20190d", controlOn: "#eda11a", controlGlyph: "#2a1c03", controlThumbOn: "#ffffff", controlFill: "#eda11a" }, dark: { accent: "#ffcb62", accentStrong: "#ffe0a1", accentSubtle: "rgba(243, 173, 32, 0.2)", accentForeground: "#20190d", controlOn: "#e8a52a", controlGlyph: "#241803", controlThumbOn: "#ffffff", controlFill: "#e8a52a" } },
  orange: { light: { accent: "#f48120", accentStrong: "#aa4700", accentSubtle: "rgba(244, 129, 32, 0.13)", accentForeground: "#17130f", controlOn: "#f07818", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#f07818" }, dark: { accent: "#ffad5e", accentStrong: "#ffd0a0", accentSubtle: "rgba(244, 129, 32, 0.2)", accentForeground: "#17130f", controlOn: "#ef873a", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#ef873a" } },
  coral: { light: { accent: "#f15f55", accentStrong: "#b92c27", accentSubtle: "rgba(241, 95, 85, 0.14)", accentForeground: "#21110f", controlOn: "#ec564b", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#ec564b" }, dark: { accent: "#ff9386", accentStrong: "#ffc1ba", accentSubtle: "rgba(241, 95, 85, 0.2)", accentForeground: "#21110f", controlOn: "#ec6a60", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#ec6a60" } },
  rose: { light: { accent: "#ed4e9d", accentStrong: "#ae2570", accentSubtle: "rgba(237, 78, 157, 0.14)", accentForeground: "#250f1b", controlOn: "#e64494", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#e64494" }, dark: { accent: "#ff8bc5", accentStrong: "#ffc0df", accentSubtle: "rgba(237, 78, 157, 0.2)", accentForeground: "#250f1b", controlOn: "#e457a0", controlGlyph: "#ffffff", controlThumbOn: "#ffffff", controlFill: "#e457a0" } },
} as const satisfies Record<string, { light: Partial<ManicatTokens>; dark: Partial<ManicatTokens> }>;

/** Radii from foundation.css, in density-independent pixels. */
export const radii = { control: 18, panel: 26, surface: 34, pill: 9999 } as const;
// </generated>

/** Shape and rhythm shared by every component, in density-independent pixels. */
export const metrics = {
  radiusControl: 18,
  radiusPill: 9999,
  controlHeight: { sm: 36, md: 44, lg: 50 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
  text: { xs: 12, sm: 14, lg: 18 },
} as const;

/** The tokens for the device's current colour scheme. Wrap the app in your own provider if you manage the theme yourself. */
export function useTokens(): ManicatTokens {
  return useColorScheme() === "dark" ? darkTokens : lightTokens;
}
