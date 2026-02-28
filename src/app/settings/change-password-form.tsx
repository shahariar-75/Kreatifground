"use client";

import { useActionState } from "react";

import { changePasswordAction } from "@/app/auth-actions";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, null as { error?: string; success?: boolean } | null);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="password" className="block text-xs font-medium text-slate-300">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:ring"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-xs font-medium text-slate-300">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-500 focus:ring"
          placeholder="••••••••"
        />
      </div>
      {state?.error && <p className="text-sm text-rose-300">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-300">Password updated. Use it next time you sign in.</p>
      )}
      <button
        type="submit"
        className="rounded-lg bg-cyan-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
      >
        Change password
      </button>
    </form>
  );
}
