import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/lib/rn-text";
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from "react-native";
import { Button } from "@/registry/components/button/button.rn";
import { Input } from "@/registry/components/input/input.rn";
import { OtpInput } from "@/registry/components/otp-input/otp-input.rn";
import { useTokens } from "@/lib/rn-tokens";

export interface SignInAccount { name: string; email: string }
export type SignInMethod = "email" | "Google" | "Apple" | "GitHub" | "passkey";

export interface SignInProps extends ViewProps {
  /** The code the simulated email contains. */
  demoCode?: string;
  /** Called once the simulated sign in succeeds. */
  onSignIn?: (account: SignInAccount, method: SignInMethod) => void;
  /** Extend the inner, named parts of the block. The React Native counterpart of `classNames`. */
  styles?: { title?: StyleProp<TextStyle>; description?: StyleProp<TextStyle>; sso?: StyleProp<ViewStyle> };
}

type Step = "email" | "code" | "done";
const RESEND_SECONDS = 30;
const providers = ["Google", "Apple", "GitHub"] as const;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export function SignIn({ demoCode = "123456", onSignIn, style, styles: parts, ...props }: SignInProps) {
  const tokens = useTokens();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [account, setAccount] = useState<SignInAccount | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const emailError = attempted && !isEmail(email) ? (email.trim() ? "Enter a full address, like name@example.com." : "Enter your email address.") : "";

  function finish(method: SignInMethod, address = email.trim() || "jasmine@northwind.studio") {
    const next = { name: address.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), email: address };
    setAccount(next);
    setStep("done");
    onSignIn?.(next, method);
  }
  function sendCode() {
    setAttempted(true);
    if (!isEmail(email)) return;
    setStep("code");
    setCode("");
    setResendIn(RESEND_SECONDS);
  }
  function verify(value: string) {
    if (value.length < 6) return setCodeError("Enter all 6 digits.");
    if (value !== demoCode) return setCodeError("That code didn't match. Check the latest email and try again.");
    finish("email");
  }

  return (
    <View {...props} accessibilityLabel="Sign in" style={[local.root, style]}>
      {step === "email" ? (
        <>
          <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>Sign in to Manicat UI</Text>
          <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>Enter your email and we will send you a 6 digit code.</Text>
          <Input label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="name@example.com" value={email} onChangeText={setEmail} error={emailError} onSubmitEditing={sendCode} />
          <Button onPress={sendCode}>Continue with email</Button>
          <View accessibilityLabel="Single sign-on" style={[local.sso, parts?.sso]}>
            {providers.map((provider) => <Button key={provider} variant="secondary" size="sm" onPress={() => finish(provider)}>{provider}</Button>)}
            <Button variant="secondary" size="sm" onPress={() => finish("passkey")}>Passkey</Button>
          </View>
        </>
      ) : null}
      {step === "code" ? (
        <>
          <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>Check your email</Text>
          <Text style={[local.description, { color: tokens.textSecondary }, parts?.description]}>Enter the 6 digit code we sent. It expires in 10 minutes.</Text>
          <View style={local.address}>
            <Text style={{ color: tokens.foreground, flex: 1 }}>{email.trim()}</Text>
            <Button variant="ghost" size="sm" accessibilityLabel="Change email" onPress={() => { setStep("email"); setCodeError(""); }}>Change</Button>
          </View>
          <OtpInput label="Verification code" description={`For this demo, the code is ${demoCode}.`} value={code} onChange={(value) => { setCode(value); setCodeError(""); if (value.length === 6) verify(value); }} error={codeError} autoFocus />
          <Button onPress={() => verify(code)}>Verify and sign in</Button>
          <Button variant="ghost" size="sm" disabled={resendIn > 0} accessibilityLabel={resendIn > 0 ? `Resend code, available in ${resendIn} seconds` : "Resend code"} onPress={() => { setResendIn(RESEND_SECONDS); setCode(""); }}>
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </Button>
        </>
      ) : null}
      {step === "done" && account ? (
        <>
          <Text accessibilityRole="header" style={[local.title, { color: tokens.foreground }, parts?.title]}>Welcome back, {account.name.split(" ")[0]}</Text>
          <Text style={{ color: tokens.textSecondary }}>{account.email}</Text>
          <Button variant="secondary" onPress={() => { setStep("email"); setCode(""); setEmail(""); setAttempted(false); }}>Sign out</Button>
        </>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  root: { gap: 12 },
  title: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  description: { fontSize: 14, lineHeight: 21 },
  sso: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  address: { flexDirection: "row", alignItems: "center" },
});

export default SignIn;
