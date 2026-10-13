import { useColorScheme } from "react-native";

/** The Manicat UI design tokens as React Native values. Same names and meaning as registry/foundation.css. */
export interface ManicatTokens {
  background: string;
  surface: string;
  surfaceMuted: string;
  foreground: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentStrong: string;
  accentSubtle: string;
  success: string;
  warning: string;
  danger: string;
  controlOn: string;
  controlTrack: string;
  controlThumb: string;
  controlThumbOn: string;
}

export const lightTokens: ManicatTokens = {
  background: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f6f6f6",
  foreground: "#1b1b1b",
  textSecondary: "#6e6e6e",
  textMuted: "#8f8f8f",
  border: "#ebebeb",
  accent: "#4a4a4a",
  accentStrong: "#303030",
  accentSubtle: "rgba(74, 74, 74, 0.1)",
  success: "#1f8a4c",
  warning: "#b8741a",
  danger: "#d03b3b",
  controlOn: "#2c2c2c",
  controlTrack: "#e2e2e2",
  controlThumb: "#ffffff",
  controlThumbOn: "#ffffff",
};

export const darkTokens: ManicatTokens = {
  background: "#2b2b2b",
  surface: "#303030",
  surfaceMuted: "#3c3c3c",
  foreground: "#f1f1f1",
  textSecondary: "#c4c4c4",
  textMuted: "#a0a0a0",
  border: "#454545",
  accent: "#cfcfcf",
  accentStrong: "#e6e6e6",
  accentSubtle: "rgba(207, 207, 207, 0.13)",
  success: "#5fd48a",
  warning: "#f0b95c",
  danger: "#ff8a80",
  controlOn: "#ececec",
  controlTrack: "#515151",
  controlThumb: "#f4f4f4",
  controlThumbOn: "#2b2b2b",
};

/** Shape and rhythm shared by every component, in density-independent pixels. */
export const metrics = {
  radiusControl: 18,
  radiusPill: 9999,
  controlHeight: { sm: 36, md: 44, lg: 50 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
  text: { xs: 12, sm: 14 },
} as const;

/** The tokens for the device's current colour scheme. Wrap the app in your own provider if you manage the theme yourself. */
export function useTokens(): ManicatTokens {
  return useColorScheme() === "dark" ? darkTokens : lightTokens;
}
