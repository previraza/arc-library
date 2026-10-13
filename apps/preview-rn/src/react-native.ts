import { useSyncExternalStore } from "react";

export * from "react-native-web";

// react-native-web follows the system color scheme and has no way to change it, so the viewer keeps its own and
// `useColorScheme` (which the ports read through `useTokens`) follows it.
type Scheme = "light" | "dark";
let scheme: Scheme = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const listeners = new Set<() => void>();

export function setColorScheme(next: Scheme) {
  scheme = next;
  listeners.forEach((listener) => listener());
}

export function useColorScheme(): Scheme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => scheme,
    () => "light",
  );
}
