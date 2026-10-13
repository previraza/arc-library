<script lang="ts" module>
  export interface SignInAccount { name: string; email: string }
  export type SignInMethod = "email" | "Google" | "Apple" | "GitHub" | "passkey";
</script>

<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";
  import Input from "@/registry/components/input/input.svelte";
  import OtpInput from "@/registry/components/otp-input/otp-input.svelte";

  interface Props {
    /** The code the simulated email contains. */
    demoCode?: string;
    /** Called once the simulated sign in succeeds. */
    onsignin?: (account: SignInAccount, method: SignInMethod) => void;
    /** Extend the inner, named parts of the block: title, description or sso. */
    classNames?: { title?: string; description?: string; sso?: string };
  }

  let { demoCode = "123456", onsignin, classNames }: Props = $props();

  const RESEND_SECONDS = 30;
  const providers = ["Google", "Apple", "GitHub"] as const;
  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

  let step = $state<"email" | "code" | "done">("email");
  let email = $state("");
  let attempted = $state(false);
  let code = $state("");
  let codeError = $state("");
  let resendIn = $state(0);
  let account = $state<SignInAccount | null>(null);
  let timer: ReturnType<typeof setInterval> | undefined;

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

  function finish(method: SignInMethod) {
    const address = email.trim() || "jasmine@northwind.studio";
    account = { name: address.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), email: address };
    step = "done";
    onsignin?.(account, method);
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
  function reset() {
    step = "email";
    code = email = "";
    attempted = false;
  }
</script>

<section class="mc-signin" aria-label="Sign in">
  {#if step === "email"}
    <h2 class={["mc-signin__title", classNames?.title]}>Sign in to Manicat UI</h2>
    <p class={["mc-signin__description", classNames?.description]}>Enter your email and we will send you a 6 digit code.</p>
    <form class="mc-signin__form" novalidate onsubmit={sendCode}>
      <Input bind:value={email} label="Email" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" error={emailError} />
      <Button type="submit">Continue with email</Button>
    </form>
    <div class={["mc-signin__sso", classNames?.sso]} role="group" aria-label="Single sign-on">
      {#each providers as provider (provider)}
        <Button variant="secondary" size="sm" onclick={() => finish(provider)}>{provider}</Button>
      {/each}
      <Button variant="secondary" size="sm" onclick={() => finish("passkey")}>Passkey</Button>
    </div>
  {:else if step === "code"}
    <h2 class={["mc-signin__title", classNames?.title]}>Check your email</h2>
    <p class={["mc-signin__description", classNames?.description]}>Enter the 6 digit code we sent. It expires in 10 minutes.</p>
    <p class="mc-signin__address"><span>{email.trim()}</span><Button variant="ghost" size="sm" aria-label="Change email" onclick={() => (step = "email")}>Change</Button></p>
    <OtpInput bind:value={() => code, onCode} label="Verification code" description="For this demo, the code is {demoCode}." error={codeError} autoFocus />
    <Button onclick={verify}>Verify and sign in</Button>
    <Button variant="ghost" size="sm" disabled={resendIn > 0} aria-label={resendIn > 0 ? `Resend code, available in ${resendIn} seconds` : "Resend code"} onclick={countdown}>{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}</Button>
  {:else if account}
    <h2 class={["mc-signin__title", classNames?.title]}>Welcome back, {account.name.split(" ")[0]}</h2>
    <p class={["mc-signin__description", classNames?.description]}>{account.email}</p>
    <Button variant="secondary" onclick={reset}>Sign out</Button>
  {/if}
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-signin { display: grid; gap: 14px; max-width: 420px; color: var(--foreground); }
.mc-signin__title { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -.04em; }
.mc-signin__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-signin__form { display: grid; gap: 14px; }
.mc-signin__sso { display: flex; flex-wrap: wrap; gap: 8px; }
.mc-signin__address { display: flex; align-items: center; justify-content: space-between; margin: 0; }
}
</style>
