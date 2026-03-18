<script lang="ts" setup>
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
const supabase = useSupabaseClient();

const fields: AuthFormField[] = [
  {
    name: 'identifier',
    type: 'text',
    label: 'Username or email',
    placeholder: 'username or user@example.com',
    required: true
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Password',
    required: true
  }
];

const schema = z.object({
  identifier: z.string().min(3, "Please enter at least 3 characters"),
  password: z.string().min(8, "Password contains at least 8 characters")
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;

  try {
    let identifier = payload.data.identifier.trim();

    if (!identifier.includes('@')) {
      const res = await $fetch<{ email: string }>('/api/auth/resolve-username', {
        method: 'POST',
        body: {username: identifier}
      });
      identifier = res.email;
    }

    const {error} = await supabase.auth.signInWithPassword({
      email: identifier,
      password: payload.data.password
    });

    if (error) {
      throw error;
    }

    toast.add({
      title: 'You are now connected',
      color: 'success'
    });

    await navigateTo('/')
  } catch (err: unknown) {
    const defaultMessage = 'Username/email or password incorrect';

    const message = err instanceof Error
        ? err.message || defaultMessage
        : defaultMessage;

    toast.add({
      title: message,
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
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">Welcome back</h1>
        <p class="mt-1 text-sm text-zinc-500">Sign in to your account</p>
      </div>

      <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <UAuthForm
            :schema="schema"
            :fields="fields"
            :loading="loading"
            submit-label="Sign in"
            @submit="onSubmit"
        >
          <template #description>
            <span class="text-zinc-500 text-sm">
              Don't have an account?
              <ULink to="/auth/register" class="font-medium text-primary-600 dark:text-primary-400 hover:underline">Create one</ULink>
            </span>
          </template>
        </UAuthForm>
      </div>
    </div>
  </div>
</template>
