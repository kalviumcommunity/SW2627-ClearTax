"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type LoginFormProps = {
  nextPath: string;
};

export default function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setFieldErrors({});
    setMessage("");
    setPending(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        callbackUrl: nextPath,
      });

      if (!result?.ok) {
        setMessage("Invalid email or password.");
        return;
      }

      router.push(result.url ?? nextPath);
      router.refresh();
    } catch {
      setMessage("Unable to sign in right now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-lg border border-border bg-surface p-5 shadow-card"
    >
      <div>
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
        />
        {fieldErrors.email ? (
          <p id="email-error" className="mt-1 text-sm text-error-foreground">
            {fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={
            fieldErrors.password ? "password-error" : undefined
          }
          className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
        />
        {fieldErrors.password ? (
          <p id="password-error" className="mt-1 text-sm text-error-foreground">
            {fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {message ? (
        <p className="mt-4 text-sm text-error-foreground">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
