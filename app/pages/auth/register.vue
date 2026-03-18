<script setup lang="ts">
import * as z from "zod";
import type {AuthFormField, FormSubmitEvent} from "#ui/types";

type ApiErrorData = {
  statusMessage?: string
}

function hasApiErrorData(error: unknown): error is { data?: ApiErrorData } {
  return typeof error === 'object' && error !== null && 'data' in error
}

const toast = useToast();
const loading = ref(false);

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Email",
    required: true
  },
  {
    name: "username",
    type: "text",
    label: "Username",
    placeholder: "Username",
    required: true
  },

  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "Password",
    required: true
  },
  {
    name: "confirmPassword",
    type: "password",
    label: "Confirm password",
    placeholder: "Confirm password",
    required: true
  }
];

const schema = z.object({
  username: z.string().min(3, "Invalid must have at least 3 characters"),
  email: z.email("Invalid Email"),
  password: z.string("Password required")
      .min(8, "Password should contain at least 8 characters"),
  confirmPassword: z.string("Password confirmation required"),
})
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords doesn't match"
    })

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;

  try {
    const res = await $fetch<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: {
        username: payload.data.username,
        email: payload.data.email,
        password: payload.data.password,
        confirmPassword: payload.data.confirmPassword
      }
    });

    toast.add({
      title: res.message || 'Account successfully created',
      color: 'success'
    });

    await navigateTo('/auth/login')
  } catch (err: unknown) {
    const message = hasApiErrorData(err)
        ? (err?.data?.statusMessage || 'Error while creating account')
        : 'Error while creating account'


    toast.add({
      title: message || 'Error while creating account',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <NuxtLink to="/" class="inline-flex items-center gap-2 mb-6">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 dark:bg-primary-500">
            <UIcon name="i-lucide-music" class="h-5 w-5 text-white" />
          </div>
          <span class="text-lg font-bold text-zinc-900 dark:text-white">MusicHub</span>
        </NuxtLink>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">Create an account</h1>
        <p class="mt-1 text-sm text-zinc-500">Join MusicHub and share your music taste</p>
      </div>

      <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <UAuthForm
            :schema="schema"
            :fields="fields"
            submit-label="Create account"
            @submit="onSubmit"
        >
          <template #description>
            <span class="text-zinc-500 text-sm">
              Already have an account?
              <ULink to="/auth/login" class="font-medium text-primary-600 dark:text-primary-400 hover:underline">Sign in</ULink>
            </span>
          </template>
        </UAuthForm>
      </div>
    </div>
  </div>
</template>
