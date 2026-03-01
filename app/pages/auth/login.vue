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
    const res = await $fetch<{ message: string }>('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: payload.data.identifier,
        password: payload.data.password
      }
    });

    toast.add({
      title: res.message || 'You are now connected ',
      color: 'success'
    });

    await navigateTo('/')
  } catch (err: unknown) {
    const message = hasApiErrorData(err)
        ? (err?.data?.statusMessage || 'Username/Email or password incorrect')
        : 'Username/Email or password incorrect'

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
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold">
          Connexion
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Connect with your username or email.
        </p>
      </template>

      <UAuthForm
          :schema="schema"
          title="Connexion"
          description="Enter your information to connect"
          icon="i-lucide-log-in"
          :fields="fields"
          :loading="loading"
          @submit="onSubmit">
        <template #description>
          Don't have an account ?
          <ULink to="/auth/register" class="text-primary hover:underline">Create one</ULink>
        </template>
      </UAuthForm>
    </UCard>
  </div>
</template>
