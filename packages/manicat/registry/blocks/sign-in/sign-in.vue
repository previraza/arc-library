<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import Button from "@/registry/components/button/button.vue";
import Input from "@/registry/components/input/input.vue";
import OtpInput from "@/registry/components/otp-input/otp-input.vue";

export interface SignInAccount { name: string; email: string }
export type SignInMethod = "email" | "Google" | "Apple" | "GitHub" | "passkey";

const props = withDefaults(
  defineProps<{
    /** The code the simulated email contains. */
    demoCode?: string;
    /** Extend the inner, named parts of the block: title, description or sso. */
    classNames?: { title?: string; description?: string; sso?: string };
  }>(),
  { demoCode: "123456" },
);
/** Fires once the simulated sign in succeeds. */
const emit = defineEmits<{ signIn: [account: SignInAccount, method: SignInMethod] }>();

const RESEND_SECONDS = 30;
const providers = ["Google", "Apple", "GitHub"] as const;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const step = ref<"email" | "code" | "done">("email");
const email = ref("");
const attempted = ref(false);
const code = ref("");
const codeError = ref("");
const resendIn = ref(0);
const account = ref<SignInAccount | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

const emailError = computed(() => (attempted.value && !isEmail(email.value) ? (email.value.trim() ? "Enter a full address, like name@example.com." : "Enter your email address.") : ""));

function countdown() {
  resendIn.value = RESEND_SECONDS;
  clearInterval(timer);
  timer = setInterval(() => {
    resendIn.value -= 1;
    if (resendIn.value <= 0) clearInterval(timer);
  }, 1000);
}
onBeforeUnmount(() => clearInterval(timer));

function finish(method: SignInMethod) {
  const address = email.value.trim() || "jasmine@northwind.studio";
  account.value = { name: address.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), email: address };
  step.value = "done";
  emit("signIn", account.value, method);
}
function sendCode() {
  attempted.value = true;
  if (!isEmail(email.value)) return;
  step.value = "code";
  code.value = "";
  countdown();
}
function verify() {
  if (code.value.length < 6) codeError.value = "Enter all 6 digits.";
  else if (code.value !== props.demoCode) codeError.value = "That code didn't match. Check the latest email and try again.";
  else finish("email");
}
function onCode(value: string) {
  code.value = value;
  codeError.value = "";
  if (value.length === 6) verify();
}
function reset() {
  step.value = "email";
  code.value = email.value = "";
  attempted.value = false;
}
</script>

<template>
  <section class="mc-signin" aria-label="Sign in">
    <template v-if="step === 'email'">
      <h2 :class="['mc-signin__title', classNames?.title]">Sign in to Manicat UI</h2>
      <p :class="['mc-signin__description', classNames?.description]">Enter your email and we will send you a 6 digit code.</p>
      <form class="mc-signin__form" novalidate @submit.prevent="sendCode">
        <Input v-model="email" label="Email" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" :error="emailError" />
        <Button type="submit">Continue with email</Button>
      </form>
      <div :class="['mc-signin__sso', classNames?.sso]" role="group" aria-label="Single sign-on">
        <Button v-for="provider in providers" :key="provider" variant="secondary" size="sm" @click="finish(provider)">{{ provider }}</Button>
        <Button variant="secondary" size="sm" @click="finish('passkey')">Passkey</Button>
      </div>
    </template>
    <template v-else-if="step === 'code'">
      <h2 :class="['mc-signin__title', classNames?.title]">Check your email</h2>
      <p :class="['mc-signin__description', classNames?.description]">Enter the 6 digit code we sent. It expires in 10 minutes.</p>
      <p class="mc-signin__address"><span>{{ email.trim() }}</span><Button variant="ghost" size="sm" aria-label="Change email" @click="step = 'email'">Change</Button></p>
      <OtpInput :model-value="code" label="Verification code" :description="`For this demo, the code is ${demoCode}.`" :error="codeError" auto-focus @update:model-value="onCode" />
      <Button @click="verify">Verify and sign in</Button>
      <Button variant="ghost" size="sm" :disabled="resendIn > 0" :aria-label="resendIn > 0 ? `Resend code, available in ${resendIn} seconds` : 'Resend code'" @click="countdown">{{ resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code" }}</Button>
    </template>
    <template v-else-if="account">
      <h2 :class="['mc-signin__title', classNames?.title]">Welcome back, {{ account.name.split(" ")[0] }}</h2>
      <p :class="['mc-signin__description', classNames?.description]">{{ account.email }}</p>
      <Button variant="secondary" @click="reset">Sign out</Button>
    </template>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-signin { display: grid; gap: 14px; max-width: 420px; color: var(--foreground); }
.mc-signin__title { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -.04em; }
.mc-signin__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-signin__form { display: grid; gap: 14px; }
.mc-signin__sso { display: flex; flex-wrap: wrap; gap: 8px; }
.mc-signin__address { display: flex; align-items: center; justify-content: space-between; margin: 0; }
</style>
