<script lang="ts" module>
  export interface SignupDetails {
    name: string;
    email: string;
    password: string;
    productUpdates: boolean;
  }
  export type SignupProvider = "Google" | "Apple" | "GitHub";
</script>

<script lang="ts">
  import Button from "@/registry/components/button/button.svelte";
  import Checkbox from "@/registry/components/checkbox/checkbox.svelte";
  import Input from "@/registry/components/input/input.svelte";
  import PasswordField from "@/registry/components/password-field/password-field.svelte";

  type Field = "name" | "email" | "password";

  interface Props {
    /** An error from your API, shown above the submit button. */
    serverError?: string | null;
    /** Receives the details once every field is valid. Reject to show a submit error. */
    onSubmit?: (details: SignupDetails) => void | Promise<void>;
    onprovider?: (provider: SignupProvider) => void;
    /** Extend the inner, named parts of the form: title, description, sso or error. */
    classNames?: { title?: string; description?: string; sso?: string; error?: string };
  }

  let { serverError, onSubmit, onprovider, classNames }: Props = $props();

  const providers: SignupProvider[] = ["Google", "Apple", "GitHub"];
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  let name = $state("");
  let email = $state("");
  let password = $state("");
  let productUpdates = $state(false);
  let touched = $state<Record<Field, boolean>>({ name: false, email: false, password: false });
  let submitted = $state(false);
  let busy = $state(false);
  let submitError = $state("");
  let done = $state<string | null>(null);

  const errors = $derived<Record<Field, string>>({
    name: name.trim().length < 2 ? "Enter your full name." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? "Enter a full address, like name@example.com." : "",
    password: password.length < 8 ? "Use at least 8 characters." : "",
  });
  const score = $derived.by(() => {
    if (!password) return 0;
    return [password.length >= 8, password.length >= 12, /[a-z]/.test(password) && /[A-Z]/.test(password), /\d|[^\w\s]/.test(password)].filter(Boolean).length;
  });
  const show = (field: Field) => (touched[field] || submitted ? errors[field] : "");
  const passwordHint = $derived(show("password") || (password ? `${strengthLabel[Math.max(score, 1)]} password` : "Use 8 or more characters"));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    submitted = true;
    submitError = "";
    if (Object.values(errors).some(Boolean)) return;
    busy = true;
    try {
      await onSubmit?.({ name: name.trim(), email: email.trim(), password, productUpdates });
      done = name.trim().split(/\s+/)[0] || "there";
    } catch (error) {
      submitError = error instanceof Error && error.message ? error.message : "We couldn't create your account. Try again.";
    } finally {
      busy = false;
    }
  }
  function reset() {
    done = null;
    name = email = password = "";
    submitted = false;
    touched = { name: false, email: false, password: false };
  }
</script>

<section class="mc-signup" aria-label="Create an account">
  {#if done}
    <div class="mc-signup__done">
      <h2 class={["mc-signup__title", classNames?.title]}>You're in, {done}</h2>
      <p class={["mc-signup__description", classNames?.description]}>We sent a confirmation link to {email.trim()}.</p>
      <Button variant="secondary" onclick={reset}>Start again</Button>
    </div>
  {:else}
    <h2 class={["mc-signup__title", classNames?.title]}>Create your account</h2>
    <p class={["mc-signup__description", classNames?.description]}>Start with your work email. You can invite your team after.</p>
    <div class={["mc-signup__sso", classNames?.sso]} role="group" aria-label="Sign up with">
      {#each providers as provider (provider)}
        <Button variant="secondary" size="sm" aria-label="Sign up with {provider}" onclick={() => onprovider?.(provider)}>{provider}</Button>
      {/each}
    </div>
    <p class="mc-signup__divider">or</p>
    <form class="mc-signup__form" novalidate onsubmit={submit}>
      <Input bind:value={name} label="Full name" name="name" autocomplete="name" placeholder="Jasmine Brooks" error={show("name")} onblur={() => name && (touched.name = true)} />
      <Input bind:value={email} label="Work email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" error={show("email")} onblur={() => email && (touched.email = true)} />
      <PasswordField bind:value={password} label="Password" name="password" autocomplete="new-password" description={passwordHint} onblur={() => password && (touched.password = true)} />
      <Checkbox bind:checked={productUpdates} label="Send me product updates" />
      {#if submitError || serverError}<p role="alert" class={["mc-signup__error", classNames?.error]}>{submitError || serverError}</p>{/if}
      <Button type="submit" loading={busy}>Create account</Button>
    </form>
  {/if}
</section>

<style>
:global {
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-signup { display: grid; gap: 14px; max-width: 420px; color: var(--foreground); }
.mc-signup__title { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -.04em; }
.mc-signup__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-signup__sso { display: flex; flex-wrap: wrap; gap: 8px; }
.mc-signup__divider { margin: 0; color: var(--text-muted); text-align: center; font-size: var(--text-xs); }
.mc-signup__form, .mc-signup__done { display: grid; gap: 14px; }
.mc-signup__error { margin: 0; color: var(--danger); font-size: var(--text-sm); }
}
</style>
