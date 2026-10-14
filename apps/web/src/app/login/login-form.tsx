"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must contain at least 8 characters."),
  businessSlug: z.string().trim().optional(),
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const form = useForm<LoginValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: LoginValues) {
    setError(undefined);
    try {
      await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.push("/workspace");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sign in failed.",
      );
    }
  }

  return (
    <form
      className="mt-9 space-y-5"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">
          Email address
        </span>
        <input
          {...form.register("email")}
          autoComplete="email"
          className="mt-2 h-12 w-full rounded-xl border bg-white px-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          type="email"
        />
        {form.formState.errors.email && (
          <span className="mt-2 block text-sm text-red-600">
            {form.formState.errors.email.message}
          </span>
        )}
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Password</span>
        <input
          {...form.register("password")}
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-xl border bg-white px-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          type="password"
        />
        {form.formState.errors.password && (
          <span className="mt-2 block text-sm text-red-600">
            {form.formState.errors.password.message}
          </span>
        )}
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">
          Business code{" "}
          <span className="font-normal text-slate-400">optional</span>
        </span>
        <input
          {...form.register("businessSlug")}
          autoComplete="organization"
          className="mt-2 h-12 w-full rounded-xl border bg-white px-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="siddique-sons"
        />
      </label>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <LoaderCircle className="size-4 animate-spin" />
        )}
        Sign in securely
      </Button>
    </form>
  );
}
