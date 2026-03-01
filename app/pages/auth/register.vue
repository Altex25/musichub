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
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold">
          Create an account
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Join MusicHub and share your music taste with the world.
        </p>
      </template>

      <UAuthForm
          :schema="schema"
          title="Create an account"
          description="Enter your information to create an account"
          icon="i-lucide-user"
          :fields="fields"
          @submit="onSubmit"
      >
        <template #description>
          Already have an account ?
          <ULink to="/auth/login" class="text-primary hover:underline">Connect</ULink>
        </template>
      </UAuthForm>
    </UCard>
  </div>
</template>
