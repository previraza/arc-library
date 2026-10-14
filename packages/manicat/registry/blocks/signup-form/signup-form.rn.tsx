import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { Checkbox } from "@/registry/components/checkbox/checkbox.rn";
import { Input } from "@/registry/components/input/input.rn";
import { PasswordField } from "@/registry/components/password-field/password-field.rn";
import { useTokens } from "@/lib/rn-tokens";

export interface SignupDetails {
  name: string;
  email: string;
  password: string;
  productUpdates: boolean;
}
export type SignupProvider = "Google" | "Apple" | "GitHub";

export interface SignupFormProps extends ViewProps {
  /** Receives the details once every field is valid. Throw to show a submit error. */
  onSubmit?: (details: SignupDetails) => void | Promise<void>;
  /** An error from your API, shown above the submit button. */
  serverError?: string | null;
  /** Called when someone picks a single sign-on provider. */
  onProvider?: (provider: SignupProvider) => void;
  /** Extend the inner, named parts of the form. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; error?: StyleProp<TextStyle>; sso?: StyleProp<ViewStyle> };
}

type Field = "name" | "email" | "password";
const providers: SignupProvider[] = ["Google", "Apple", "GitHub"];
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];

function getErrors(name: string, email: string, password: string): Record<Field, string> {
  return {
    name: name.trim().length < 2 ? "Enter your full name." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? "Enter a full address, like name@example.com." : "",
    password: password.length < 8 ? "Use at least 8 characters." : "",
  };
}
function passwordScore(password: string) {
  if (!password) return 0;
  return [password.length >= 8, password.length >= 12, /[a-z]/.test(password) && /[A-Z]/.test(password), /\d|[^\w\s]/.test(password)].filter(Boolean).length;
}

export function SignupForm({ onSubmit, serverError, onProvider, style, styles: parts, ...props }: SignupFormProps) {
  const tokens = useTokens();
  const [done, setDone] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [productUpdates, setProductUpdates] = useState(false);
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, email: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const errors = getErrors(name, email, password);
  const score = passwordScore(password);
  const show = (field: Field) => (touched[field] || submitted ? errors[field] : "");
  const touch = (field: Field) => setTouched((current) => ({ ...current, [field]: true }));

  async function submit() {
    if (busy) return;
    setSubmitted(true);
    setSubmitError("");
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    try {
      await onSubmit?.({ name: name.trim(), email: email.trim(), password, productUpdates });
      setDone(name.trim().split(/\s+/)[0] || "there");
    } catch (error) {
      setSubmitError(error instanceof Error && error.message ? error.message : "We couldn't create your account. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <View {...props} style={[local.root, style]}>
        <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>You&apos;re in, {done}</Text>
        <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>We sent a confirmation link to {email.trim()}.</Text>
        <Button variant="secondary" onPress={() => { setDone(null); setName(""); setEmail(""); setPassword(""); setSubmitted(false); setTouched({ name: false, email: false, password: false }); }}>Start again</Button>
      </View>
    );
  }

  const shownError = submitError || serverError || "";
  return (
    <View {...props} style={[local.root, style]}>
      <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>Create your account</Text>
      <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>Start with your work email. You can invite your team after.</Text>
      <View accessibilityLabel="Sign up with" style={[local.sso, parts?.sso]}>
        {providers.map((provider) => <Button key={provider} variant="secondary" size="sm" accessibilityLabel={`Sign up with ${provider}`} onPress={() => onProvider?.(provider)}>{provider}</Button>)}
      </View>
      <Text style={{ color: tokens.textMuted, textAlign: "center" }}>or</Text>
      <Input label="Full name" autoComplete="name" placeholder="Jasmine Brooks" value={name} onChangeText={setName} onBlur={() => name && touch("name")} error={show("name")} />
      <Input label="Work email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="name@example.com" value={email} onChangeText={setEmail} onBlur={() => email && touch("email")} error={show("email")} />
      <PasswordField label="Password" autoComplete="new-password" value={password} onChangeText={setPassword} onBlur={() => password && touch("password")} description={show("password") || (password ? `${strengthLabel[Math.max(score, 1)]} password` : "Use 8 or more characters")} />
      <Checkbox checked={productUpdates} onCheckedChange={(next) => setProductUpdates(next === true)} label="Send me product updates" />
      {shownError ? <Text accessibilityRole="alert" style={[{ color: tokens.danger, fontSize: 13 }, parts?.error]}>{shownError}</Text> : null}
      <Button loading={busy} onPress={() => void submit()}>Create account</Button>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  description: { fontSize: 14, lineHeight: 21 },
  sso: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

export default SignupForm;
