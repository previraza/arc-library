<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import Button from "@/registry/components/button/button.vue";
import Input from "@/registry/components/input/input.vue";
import OtpInput from "@/registry/components/otp-input/otp-input.vue";

type Method = "passkey" | "email" | "Google" | "Apple" | "GitHub";
type Step = "passkey" | "email" | "code" | "done";

const props = withDefaults(
  defineProps<{
    /** The code the simulated email contains. */
    demoCode?: string;
    termsHref?: string;
    privacyHref?: string;
    /** Extend the inner, named parts of the block: title, description, sso or legal. */
    classNames?: { title?: string; description?: string; sso?: string; legal?: string };
  }>(),
  { demoCode: "482913", termsHref: "#terms", privacyHref: "#privacy" },
);
/** Fires once the simulated sign in or sign up succeeds. */
const emit = defineEmits<{ signIn: [details: { email: string; method: Method; mode: "sign-in" | "sign-up" }] }>();

const RESEND_SECONDS = 30;
const providers = ["Google", "Apple", "GitHub"] as const;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const mode = ref<"sign-in" | "sign-up">("sign-in");
const step = ref<Step>("passkey");
const email = ref("");
const attempted = ref(false);
const code = ref("");
const codeError = ref("");
const resendIn = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
const signingUp = computed(() => mode.value === "sign-up");
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

function finish(method: Method) {
  step.value = "done";
  emit("signIn", { email: email.value.trim() || "maya@northwind.studio", method, mode: mode.value });
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
function switchMode() {
  mode.value = signingUp.value ? "sign-in" : "sign-up";
  step.value = signingUp.value ? "email" : "passkey";
  attempted.value = false;
}
function reset() {
  step.value = "passkey";
  mode.value = "sign-in";
  email.value = code.value = "";
}
</script>

<template>
  <section class="mc-login" :aria-label="signingUp ? 'Create an account' : 'Sign in'">
    <template v-if="step === 'passkey'">
      <h2 :class="['mc-login__title', classNames?.title]">Sign in to Manicat UI</h2>
      <p :class="['mc-login__description', classNames?.description]">Use the passkey saved on this device. No password needed.</p>
      <Button @click="finish('passkey')">Continue with passkey</Button>
      <div :class="['mc-login__sso', classNames?.sso]" role="group" aria-label="Single sign-on">
        <Button v-for="provider in providers" :key="provider" variant="secondary" size="sm" @click="finish(provider)">{{ provider }}</Button>
      </div>
      <Button variant="ghost" size="sm" @click="step = 'email'">Use email instead</Button>
    </template>
    <template v-else-if="step === 'email'">
      <h2 :class="['mc-login__title', classNames?.title]">{{ signingUp ? "Create your account" : "Sign in with email" }}</h2>
      <p :class="['mc-login__description', classNames?.description]">{{ signingUp ? "Enter your work email. We will send a code to confirm it." : "We will send a 6 digit code to your inbox." }}</p>
      <form class="mc-login__form" novalidate @submit.prevent="sendCode">
        <Input v-model="email" :label="signingUp ? 'Work email' : 'Email'" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" :error="emailError" />
        <Button type="submit">{{ signingUp ? "Send code" : "Continue" }}</Button>
      </form>
      <Button v-if="!signingUp" variant="ghost" size="sm" @click="step = 'passkey'">Use a passkey instead</Button>
    </template>
    <template v-else-if="step === 'code'">
      <h2 :class="['mc-login__title', classNames?.title]">Check your email</h2>
      <p :class="['mc-login__description', classNames?.description]">Enter the code sent to {{ email.trim() }}.</p>
      <OtpInput :model-value="code" label="Verification code" :description="`Demo code: ${demoCode}`" :error="codeError" auto-focus @update:model-value="onCode" />
      <Button @click="verify">{{ signingUp ? "Verify and create account" : "Verify and sign in" }}</Button>
      <Button variant="ghost" size="sm" :disabled="resendIn > 0" @click="countdown">{{ resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code" }}</Button>
      <Button variant="ghost" size="sm" @click="step = 'email'">Change email</Button>
    </template>
    <template v-else>
      <h2 :class="['mc-login__title', classNames?.title]">{{ signingUp ? "Welcome to Manicat UI" : "Welcome back" }}</h2>
      <p :class="['mc-login__description', classNames?.description]">{{ signingUp ? "Your account is ready. " : "You are signed in as " }}{{ email.trim() || "maya@northwind.studio" }}</p>
      <Button variant="secondary" @click="reset">Sign out</Button>
    </template>
    <p class="mc-login__switch">{{ signingUp ? "Already have an account?" : "New here?" }} <button type="button" @click="switchMode">{{ signingUp ? "Sign in" : "Sign up" }}</button></p>
    <p :class="['mc-login__legal', classNames?.legal]">By continuing you agree to the <a :href="termsHref">Terms</a> and <a :href="privacyHref">Privacy Policy</a>.</p>
  </section>
</template>

<style>
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
</style>
