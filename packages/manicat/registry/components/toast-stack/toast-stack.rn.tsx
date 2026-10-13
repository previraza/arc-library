import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { metrics, useTokens } from "@/lib/rn-tokens";

export type ToastType = "success" | "info" | "warning" | "error" | "loading";

export interface ToastAction {
  label: string;
  onClick: (id: string) => void;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  /** Milliseconds before it leaves. Pass 0 to keep it until dismissed. */
  duration?: number;
}

export interface ToastStackApi {
  toast: (options: ToastOptions) => string;
  update: (id: string, patch: Partial<Omit<ToastOptions, "id">>) => void;
  dismiss: (id?: string) => void;
}

interface Entry extends ToastOptions {
  id: string;
}

const Context = createContext<(ToastStackApi & { toasts: Entry[]; count: number }) | null>(null);

export interface ToastStackProviderProps {
  children: ReactNode;
  duration?: number;
  limit?: number;
}

/** Mount once near the root; `useToastStack()` then works anywhere below it. */
export function ToastStackProvider({ children, duration = 5000, limit = 12 }: ToastStackProviderProps) {
  const [toasts, setToasts] = useState<Entry[]>([]);
  const counter = useRef(0);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = options.id ?? `toast-${(counter.current += 1)}`;
      setToasts((current) => [{ duration, type: "info" as ToastType, ...options, id }, ...current.filter((entry) => entry.id !== id)].slice(0, limit));
      return id;
    },
    [duration, limit],
  );
  const update = useCallback((id: string, patch: Partial<Omit<ToastOptions, "id">>) => setToasts((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))), []);
  const dismiss = useCallback((id?: string) => setToasts((current) => (id ? current.filter((entry) => entry.id !== id) : [])), []);

  const value = useMemo(() => ({ toast, update, dismiss, toasts, count: toasts.length }), [toast, update, dismiss, toasts]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useToastStack() {
  const context = useContext(Context);
  if (!context) throw new Error("useToastStack must be used inside ToastStackProvider");
  return context;
}

export interface ToastStackProps {
  label?: string;
  position?: "bottom" | "top";
  /** How many toasts show at once; the rest wait their turn. */
  visibleToasts?: number;
  /** Extend the inner, named parts of the stack: toast, title, description or action. The React Native counterpart of `classNames`. */
  styles?: {
    toast?: StyleProp<ViewStyle>;
    title?: StyleProp<TextStyle>;
    description?: StyleProp<TextStyle>;
    action?: StyleProp<TextStyle>;
  };
}

function Item({ entry, onDone, styles: parts }: { entry: Entry; onDone: () => void; styles: ToastStackProps["styles"] }) {
  const tokens = useTokens();
  const { dismiss } = useToastStack();
  useEffect(() => {
    if (!entry.duration || entry.type === "loading") return;
    const timer = setTimeout(onDone, entry.duration);
    return () => clearTimeout(timer);
  }, [entry.duration, entry.type, onDone]);

  const color = { success: tokens.success, error: tokens.danger, warning: tokens.warning, info: tokens.accent, loading: tokens.textMuted }[entry.type ?? "info"];

  return (
    <View accessibilityRole="alert" style={[local.toast, { borderColor: tokens.border, backgroundColor: tokens.surface }, parts?.toast]}>
      {entry.type === "loading" ? <ActivityIndicator size="small" color={color} /> : <View style={[local.dot, { backgroundColor: color }]} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[{ color: tokens.foreground, fontSize: metrics.text.sm, fontWeight: "500" }, parts?.title]}>{entry.title}</Text>
        {entry.description ? <Text style={[{ color: tokens.textSecondary, fontSize: metrics.text.xs }, parts?.description]}>{entry.description}</Text> : null}
      </View>
      {entry.action ? (
        <Pressable accessibilityRole="button" onPress={() => entry.action?.onClick(entry.id)} hitSlop={8}>
          <Text style={[{ color: tokens.foreground, fontSize: metrics.text.xs, fontWeight: "600" }, parts?.action]}>{entry.action.label}</Text>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8} onPress={() => dismiss(entry.id)}>
        <Text style={{ color: tokens.textMuted, fontSize: 18, lineHeight: 20 }}>×</Text>
      </Pressable>
    </View>
  );
}

/** Renders the queue. Place it last in your root layout so it floats over the screen. */
export function ToastStack({ label = "Notifications", position = "bottom", visibleToasts = 3, styles: parts }: ToastStackProps) {
  const { toasts, dismiss } = useToastStack();
  const shown = toasts.slice(0, visibleToasts);

  return (
    <View pointerEvents="box-none" accessibilityLabel={label} style={[local.region, position === "top" ? { top: 48 } : { bottom: 24 }]}>
      {shown.map((entry) => (
        <Item key={entry.id} entry={entry} onDone={() => dismiss(entry.id)} styles={parts} />
      ))}
    </View>
  );
}

const local = StyleSheet.create({
  region: { position: "absolute", left: 16, right: 16, gap: 8, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", gap: metrics.space[3], width: "100%", maxWidth: 420, paddingVertical: metrics.space[3], paddingHorizontal: metrics.space[4], borderWidth: 1, borderRadius: metrics.radiusControl, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export default ToastStack;
