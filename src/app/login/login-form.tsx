"use client";

import { useActionState } from "react";

import { signInAction } from "@/app/auth-actions";

export function LoginForm({
  redirectTo,
}: {
  redirectTo: string;
}) {
  const [state, formAction] = useActionState(signInAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-slate-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:ring"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-xs font-medium text-slate-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:ring"
          placeholder="••••••••"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-rose-300">{state.error}</p>
      )}
      <button
        type="submit"
        className="w-full rounded-lg bg-cyan-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
      >
        Sign in
      </button>
    </form>
  );
}
