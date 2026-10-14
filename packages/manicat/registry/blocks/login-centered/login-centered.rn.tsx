import { useEffect, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { Input } from "@/registry/components/input/input.rn";
import { OtpInput } from "@/registry/components/otp-input/otp-input.rn";
import { useTokens } from "@/lib/rn-tokens";

export interface LoginCenteredProps extends ViewProps {
  /** The code the simulated email contains. */
  demoCode?: string;
  termsHref?: string;
  privacyHref?: string;
  /** Called once the simulated sign in or sign up succeeds. */
  onSignIn?: (details: { email: string; method: "passkey" | "email" | "Google" | "Apple" | "GitHub"; mode: "sign-in" | "sign-up" }) => void;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; sso?: StyleProp<ViewStyle>; legal?: StyleProp<TextStyle> };
}

type Step = "passkey" | "email" | "code" | "done";
const RESEND_SECONDS = 30;
const providers = ["Google", "Apple", "GitHub"] as const;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export function LoginCentered({ demoCode = "482913", termsHref = "#terms", privacyHref = "#privacy", onSignIn, style, styles: parts, ...props }: LoginCenteredProps) {
  const tokens = useTokens();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [step, setStep] = useState<Step>("passkey");
  const [email, setEmail] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const signingUp = mode === "sign-up";

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const emailError = attempted && !isEmail(email) ? (email.trim() ? "Enter a full address, like name@example.com." : "Enter your email address.") : "";
  const finish = (method: "passkey" | "email" | "Google" | "Apple" | "GitHub") => { setStep("done"); onSignIn?.({ email: email.trim() || "maya@northwind.studio", method, mode }); };
  const sendCode = () => {
    setAttempted(true);
    if (!isEmail(email)) return;
    setStep("code");
    setCode("");
    setResendIn(RESEND_SECONDS);
  };
  const verify = (value: string) => {
    if (value.length < 6) return setCodeError("Enter all 6 digits.");
    if (value !== demoCode) return setCodeError("That code didn't match. Check the latest email and try again.");
    finish("email");
  };
  const switchMode = () => { setMode(signingUp ? "sign-in" : "sign-up"); setStep(signingUp ? "passkey" : "email"); setAttempted(false); };

  const title = [parts?.title, { color: tokens.foreground }];
  return (
    <View {...props} accessibilityLabel={signingUp ? "Create an account" : "Sign in"} style={[local.root, style]}>
      {step === "passkey" ? (
        <>
          <Text accessibilityRole="header" style={[local.title, ...title]}>Sign in to Manicat UI</Text>
          <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>Use the passkey saved on this device. No password needed.</Text>
          <Button onPress={() => finish("passkey")}>Continue with passkey</Button>
          <View accessibilityLabel="Single sign-on" style={[local.sso, parts?.sso]}>
            {providers.map((provider) => <Button key={provider} variant="secondary" size="sm" onPress={() => finish(provider)}>{provider}</Button>)}
          </View>
          <Button variant="ghost" size="sm" onPress={() => setStep("email")}>Use email instead</Button>
        </>
      ) : null}
      {step === "email" ? (
        <>
          <Text accessibilityRole="header" style={[local.title, ...title]}>{signingUp ? "Create your account" : "Sign in with email"}</Text>
          <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>{signingUp ? "Enter your work email. We will send a code to confirm it." : "We will send a 6 digit code to your inbox."}</Text>
          <Input label={signingUp ? "Work email" : "Email"} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="name@example.com" value={email} onChangeText={setEmail} error={emailError} onSubmitEditing={sendCode} />
          <Button onPress={sendCode}>{signingUp ? "Send code" : "Continue"}</Button>
          {!signingUp ? <Button variant="ghost" size="sm" onPress={() => setStep("passkey")}>Use a passkey instead</Button> : null}
        </>
      ) : null}
      {step === "code" ? (
        <>
          <Text accessibilityRole="header" style={[local.title, ...title]}>Check your email</Text>
          <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>Enter the code sent to {email.trim()}.</Text>
          <OtpInput label="Verification code" description={`Demo code: ${demoCode}`} value={code} onChange={(value) => { setCode(value); setCodeError(""); if (value.length === 6) verify(value); }} error={codeError} autoFocus />
          <Button onPress={() => verify(code)}>{signingUp ? "Verify and create account" : "Verify and sign in"}</Button>
          <Button variant="ghost" size="sm" disabled={resendIn > 0} onPress={() => { setResendIn(RESEND_SECONDS); setCode(""); }}>{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}</Button>
          <Button variant="ghost" size="sm" onPress={() => setStep("email")}>Change email</Button>
        </>
      ) : null}
      {step === "done" ? (
        <>
          <Text accessibilityRole="header" style={[local.title, ...title]}>{signingUp ? "Welcome to Manicat UI" : "Welcome back"}</Text>
          <Text style={{ color: tokens.textSecondary }}>{signingUp ? "Your account is ready. " : "You are signed in as "}{email.trim() || "maya@northwind.studio"}</Text>
          <Button variant="secondary" onPress={() => { setStep("passkey"); setMode("sign-in"); setEmail(""); setCode(""); }}>Sign out</Button>
        </>
      ) : null}
      <Text style={{ color: tokens.textSecondary, fontSize: 13 }}>
        {signingUp ? "Already have an account? " : "New here? "}
        <Text accessibilityRole="button" style={{ color: tokens.foreground, fontWeight: "500" }} onPress={switchMode}>{signingUp ? "Sign in" : "Sign up"}</Text>
      </Text>
      <Text style={[{ color: tokens.textMuted, fontSize: 12 }, parts?.legal]}>
        By continuing you agree to the <Text style={{ textDecorationLine: "underline" }} onPress={() => void Linking.openURL(termsHref)}>Terms</Text> and <Text style={{ textDecorationLine: "underline" }} onPress={() => void Linking.openURL(privacyHref)}>Privacy Policy</Text>.
      </Text>
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  description: { fontSize: 14, lineHeight: 21 },
  sso: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

export default LoginCentered;
