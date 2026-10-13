<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import Button from "@/registry/components/button/button.vue";
import Checkbox from "@/registry/components/checkbox/checkbox.vue";
import Input from "@/registry/components/input/input.vue";
import PasswordField from "@/registry/components/password-field/password-field.vue";

export interface SignupDetails {
  name: string;
  email: string;
  password: string;
  productUpdates: boolean;
}
export type SignupProvider = "Google" | "Apple" | "GitHub";
type Field = "name" | "email" | "password";

const props = defineProps<{
  /** An error from your API, shown above the submit button. */
  serverError?: string | null;
  /** Receives the details once every field is valid. Reject to show a submit error. */
  onSubmit?: (details: SignupDetails) => void | Promise<void>;
  /** Extend the inner, named parts of the form: title, description, sso or error. */
  classNames?: { title?: string; description?: string; sso?: string; error?: string };
}>();
const emit = defineEmits<{ provider: [provider: SignupProvider] }>();

const providers: SignupProvider[] = ["Google", "Apple", "GitHub"];
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const name = ref("");
const email = ref("");
const password = ref("");
const productUpdates = ref(false);
const touched = reactive<Record<Field, boolean>>({ name: false, email: false, password: false });
const submitted = ref(false);
const busy = ref(false);
const submitError = ref("");
const done = ref<string | null>(null);

const errors = computed<Record<Field, string>>(() => ({
  name: name.value.trim().length < 2 ? "Enter your full name." : "",
  email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? "Enter a full address, like name@example.com." : "",
  password: password.value.length < 8 ? "Use at least 8 characters." : "",
}));
const score = computed(() => {
  const value = password.value;
  if (!value) return 0;
  return [value.length >= 8, value.length >= 12, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d|[^\w\s]/.test(value)].filter(Boolean).length;
});
const show = (field: Field) => (touched[field] || submitted.value ? errors.value[field] : "");
const passwordHint = computed(() => show("password") || (password.value ? `${strengthLabel[Math.max(score.value, 1)]} password` : "Use 8 or more characters"));

async function submit() {
  if (busy.value) return;
  submitted.value = true;
  submitError.value = "";
  if (Object.values(errors.value).some(Boolean)) return;
  busy.value = true;
  try {
    await props.onSubmit?.({ name: name.value.trim(), email: email.value.trim(), password: password.value, productUpdates: productUpdates.value });
    done.value = name.value.trim().split(/\s+/)[0] || "there";
  } catch (error) {
    submitError.value = error instanceof Error && error.message ? error.message : "We couldn't create your account. Try again.";
  } finally {
    busy.value = false;
  }
}
function reset() {
  done.value = null;
  name.value = email.value = password.value = "";
  submitted.value = false;
  Object.assign(touched, { name: false, email: false, password: false });
}
</script>

<template>
  <section class="mc-signup" aria-label="Create an account">
    <div v-if="done" class="mc-signup__done">
      <h2 :class="['mc-signup__title', classNames?.title]">You're in, {{ done }}</h2>
      <p :class="['mc-signup__description', classNames?.description]">We sent a confirmation link to {{ email.trim() }}.</p>
      <Button variant="secondary" @click="reset">Start again</Button>
    </div>
    <template v-else>
      <h2 :class="['mc-signup__title', classNames?.title]">Create your account</h2>
      <p :class="['mc-signup__description', classNames?.description]">Start with your work email. You can invite your team after.</p>
      <div :class="['mc-signup__sso', classNames?.sso]" role="group" aria-label="Sign up with">
        <Button v-for="provider in providers" :key="provider" variant="secondary" size="sm" :aria-label="`Sign up with ${provider}`" @click="emit('provider', provider)">{{ provider }}</Button>
      </div>
      <p class="mc-signup__divider">or</p>
      <form class="mc-signup__form" novalidate @submit.prevent="submit">
        <Input v-model="name" label="Full name" name="name" autocomplete="name" placeholder="Jasmine Brooks" :error="show('name')" @blur="name && (touched.name = true)" />
        <Input v-model="email" label="Work email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" :error="show('email')" @blur="email && (touched.email = true)" />
        <PasswordField v-model="password" label="Password" name="password" autocomplete="new-password" :description="passwordHint" @blur="password && (touched.password = true)" />
        <Checkbox v-model="productUpdates" label="Send me product updates" />
        <p v-if="submitError || serverError" role="alert" :class="['mc-signup__error', classNames?.error]">{{ submitError || serverError }}</p>
        <Button type="submit" :loading="busy">Create account</Button>
      </form>
    </template>
  </section>
</template>

<style>
/* Reads the Manicat UI tokens from foundation.css, so import that stylesheet once in your app. */
.mc-signup { display: grid; gap: 14px; max-width: 420px; color: var(--foreground); }
.mc-signup__title { margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -.04em; }
.mc-signup__description { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.mc-signup__sso { display: flex; flex-wrap: wrap; gap: 8px; }
.mc-signup__divider { margin: 0; color: var(--text-muted); text-align: center; font-size: var(--text-xs); }
.mc-signup__form, .mc-signup__done { display: grid; gap: 14px; }
.mc-signup__error { margin: 0; color: var(--danger); font-size: var(--text-sm); }
</style>
