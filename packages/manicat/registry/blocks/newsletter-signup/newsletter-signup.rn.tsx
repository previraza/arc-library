import { useState } from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { Input } from "@/registry/components/input/input.rn";
import { useTokens } from "@/lib/rn-tokens";

export type NewsletterVariant = "inline" | "card";

const copy = {
  inline: { title: "Five minutes on interface craft, every Friday", description: "Three links worth your time and one short essay on the details that make software feel right." },
  card: { title: "Get the next issue on Friday", description: "Three links and one short essay on interface craft. Five minutes, once a week." },
};
const messages = { empty: "Enter your email address", format: "Enter an email like name@company.com", failed: "That didn't go through. Your email is kept, so try again." };

export interface NewsletterSignupProps extends ViewProps {
  variant?: NewsletterVariant;
  title?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
  privacyNote?: string;
  privacyLink?: { label: string; href: string } | null;
  /** Social proof beside the form: a reader count and image URIs for the faces. */
  readers?: { count: number; faces: string[] } | null;
  /** Receives the address once it is valid. Throw to show the failure message and keep the email. */
  onSubscribe?: (email: string) => void | Promise<void>;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; card?: StyleProp<ViewStyle>; note?: StyleProp<TextStyle> };
}

export function NewsletterSignup({ variant = "inline", title, description, placeholder = "you@company.com", buttonLabel = "Subscribe", privacyNote = "No tracking pixels. Unsubscribe with one click.", privacyLink = { label: "Privacy policy", href: "#privacy" }, readers = null, onSubscribe, style, styles: parts, ...props }: NewsletterSignupProps) {
  const tokens = useTokens();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const text = copy[variant];

  async function submit() {
    if (busy) return;
    const value = email.trim();
    if (!value) return setError(messages.empty);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return setError(messages.format);
    setError("");
    setBusy(true);
    try {
      await onSubscribe?.(value);
      setDone(true);
    } catch {
      setError(messages.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View {...props} style={[local.root, variant === "card" && { borderWidth: 1, borderRadius: 28, padding: 20, borderColor: tokens.border, backgroundColor: tokens.surface }, style, variant === "card" && parts?.card]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>{title ?? text.title}</Text>
      <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{description ?? text.description}</Text>
      {done ? (
        <Text accessibilityLiveRegion="polite" style={{ color: tokens.success, fontWeight: "500" }}>✓ Check your inbox to confirm.</Text>
      ) : (
        <>
          <Input label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder={placeholder} value={email} onChangeText={(value) => { setEmail(value); setError(""); }} error={error} onSubmitEditing={() => void submit()} />
          <Button loading={busy} onPress={() => void submit()}>{buttonLabel}</Button>
        </>
      )}
      {readers ? (
        <View style={local.readers}>
          {readers.faces.slice(0, 4).map((uri) => <Image key={uri} source={{ uri }} alt="" style={local.face} />)}
          <Text style={{ color: tokens.textSecondary, fontSize: 13 }}>{readers.count.toLocaleString("en-US")} readers</Text>
        </View>
      ) : null}
      <Text style={[{ color: tokens.textMuted, fontSize: 12 }, parts?.note]}>
        {privacyNote}{privacyLink ? " " : ""}
        {privacyLink ? <Text accessibilityRole="link" style={{ textDecorationLine: "underline" }} onPress={() => void Linking.openURL(privacyLink.href)}>{privacyLink.label}</Text> : null}
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  description: { fontSize: 14, lineHeight: 21 },
  readers: { flexDirection: "row", alignItems: "center", gap: 8 },
  face: { width: 24, height: 24, borderRadius: 12 },
});

export default NewsletterSignup;
