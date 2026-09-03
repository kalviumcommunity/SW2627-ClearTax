"use client";

import { useActionState } from "react";
import {
  signInWithDemoCredentials,
  type LoginActionState,
} from "@/app/(auth)/login/actions";

const initialState: LoginActionState = {};

type LoginFormProps = {
  nextPath: string;
};

export default function LoginForm({ nextPath }: LoginFormProps) {
  const [state, action, pending] = useActionState(
    signInWithDemoCredentials,
    initialState,
  );

  return (
    <form action={action} className="mt-8 rounded-lg border border-border bg-surface p-5 shadow-card">
      <input type="hidden" name="next" value={nextPath} />

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
          aria-describedby={state.errors?.email ? "email-error" : undefined}
          className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
        />
        {state.errors?.email ? (
          <p id="email-error" className="mt-1 text-sm text-error-foreground">
            {state.errors.email[0]}
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
            state.errors?.password ? "password-error" : undefined
          }
          className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
        />
        {state.errors?.password ? (
          <p id="password-error" className="mt-1 text-sm text-error-foreground">
            {state.errors.password[0]}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className="mt-4 text-sm text-error-foreground">{state.message}</p>
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
