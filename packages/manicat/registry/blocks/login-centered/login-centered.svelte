<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";
  import Input from "@/registry/components/input/input.svelte";
  import OtpInput from "@/registry/components/otp-input/otp-input.svelte";

  type Method = "passkey" | "email" | "Google" | "Apple" | "GitHub";
  type Step = "passkey" | "email" | "code" | "done";

  interface Props {
    /** The code the simulated email contains. */
    demoCode?: string;
    termsHref?: string;
    privacyHref?: string;
    /** Called once the simulated sign in or sign up succeeds. */
    onsignin?: (details: { email: string; method: Method; mode: "sign-in" | "sign-up" }) => void;
    /** Extend the inner, named parts of the block: title, description, sso or legal. */
    classNames?: { title?: string; description?: string; sso?: string; legal?: string };
  }

  let { demoCode = "482913", termsHref = "#terms", privacyHref = "#privacy", onsignin, classNames }: Props = $props();

  const RESEND_SECONDS = 30;
  const providers = ["Google", "Apple", "GitHub"] as const;
  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  let mode = $state<"sign-in" | "sign-up">("sign-in");
  let step = $state<Step>("passkey");
  let email = $state("");
  let attempted = $state(false);
  let code = $state("");
  let codeError = $state("");
  let resendIn = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  const signingUp = $derived(mode === "sign-up");
  const emailError = $derived(attempted && !isEmail(email) ? (email.trim() ? "Enter a full address, like name@example.com." : "Enter your email address.") : "");

  function countdown() {
    resendIn = RESEND_SECONDS;
    clearInterval(timer);
    timer = setInterval(() => {
      resendIn -= 1;
      if (resendIn <= 0) clearInterval(timer);
    }, 1000);
  }

  $effect(() => () => clearInterval(timer));

  function finish(method: Method) {
    step = "done";
    onsignin?.({ email: email.trim() || "maya@northwind.studio", method, mode });
  }
  function sendCode(event: SubmitEvent) {
    event.preventDefault();
    attempted = true;
    if (!isEmail(email)) return;
    step = "code";
    code = "";
    countdown();
  }
  function verify() {
    if (code.length < 6) codeError = "Enter all 6 digits.";
    else if (code !== demoCode) codeError = "That code didn't match. Check the latest email and try again.";
    else finish("email");
  }
  function onCode(value: string) {
    code = value;
    codeError = "";
    if (value.length === 6) verify();
  }
  function switchMode() {
    mode = signingUp ? "sign-in" : "sign-up";
    step = signingUp ? "email" : "passkey";
    attempted = false;
  }
  function reset() {
    step = "passkey";
    mode = "sign-in";
    code = email = "";
  }
</script>

<section class="mc-login" aria-label={signingUp ? "Create an account" : "Sign in"}>
  {#if step === "passkey"}
    <h2 class={["mc-login__title", classNames?.title]}>Sign in to Manicat UI</h2>
    <p class={["mc-login__description", classNames?.description]}>Use the passkey saved on this device. No password needed.</p>
    <Button onclick={() => finish("passkey")}>Continue with passkey</Button>
    <div class={["mc-login__sso", classNames?.sso]} role="group" aria-label="Single sign-on">
      {#each providers as provider (provider)}
        <Button variant="secondary" size="sm" onclick={() => finish(provider)}>{provider}</Button>
      {/each}
    </div>
    <Button variant="ghost" size="sm" onclick={() => (step = "email")}>Use email instead</Button>
  {:else if step === "email"}
    <h2 class={["mc-login__title", classNames?.title]}>{signingUp ? "Create your account" : "Sign in with email"}</h2>
    <p class={["mc-login__description", classNames?.description]}>{signingUp ? "Enter your work email. We will send a code to confirm it." : "We will send a 6 digit code to your inbox."}</p>
    <form class="mc-login__form" novalidate onsubmit={sendCode}>
      <Input bind:value={email} label={signingUp ? "Work email" : "Email"} type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" error={emailError} />
      <Button type="submit">{signingUp ? "Send code" : "Continue"}</Button>
    </form>
    {#if !signingUp}<Button variant="ghost" size="sm" onclick={() => (step = "passkey")}>Use a passkey instead</Button>{/if}
  {:else if step === "code"}
    <h2 class={["mc-login__title", classNames?.title]}>Check your email</h2>
    <p class={["mc-login__description", classNames?.description]}>Enter the code sent to {email.trim()}.</p>
    <OtpInput bind:value={() => code, onCode} label="Verification code" description="Demo code: {demoCode}" error={codeError} autoFocus />
    <Button onclick={verify}>{signingUp ? "Verify and create account" : "Verify and sign in"}</Button>
    <Button variant="ghost" size="sm" disabled={resendIn > 0} onclick={countdown}>{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}</Button>
    <Button variant="ghost" size="sm" onclick={() => (step = "email")}>Change email</Button>
  {:else}
    <h2 class={["mc-login__title", classNames?.title]}>{signingUp ? "Welcome to Manicat UI" : "Welcome back"}</h2>
    <p class={["mc-login__description", classNames?.description]}>{signingUp ? "Your account is ready. " : "You are signed in as "}{email.trim() || "maya@northwind.studio"}</p>
    <Button variant="secondary" onclick={reset}>Sign out</Button>
  {/if}
  <p class="mc-login__switch">{signingUp ? "Already have an account?" : "New here?"} <button type="button" onclick={switchMode}>{signingUp ? "Sign in" : "Sign up"}</button></p>
  <p class={["mc-login__legal", classNames?.legal]}>By continuing you agree to the <a href={termsHref}>Terms</a> and <a href={privacyHref}>Privacy Policy</a>.</p>
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-login { display: grid; gap: 14px; max-width: 400px; margin-inline: auto; text-align: center; justify-items: center; color: var(--foreground); }
.mc-login > * { max-width: 100%; }
.mc-login__title { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -.04em; }
.mc-login__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-login__form { display: grid; gap: 14px; width: 100%; text-align: start; }
.mc-login__sso { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.mc-login__switch { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-login__switch button { border: 0; background: none; color: var(--foreground); font: inherit; font-weight: 500; cursor: pointer; }
.mc-login__legal { margin: 0; color: var(--text-muted); font-size: var(--text-xs); }
.mc-login__legal a { color: inherit; }
}
</style>
