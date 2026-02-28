import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Login | BotOps Dashboard",
  description: "Sign in to BotOps Dashboard",
};

type SearchParams = { searchParams: Promise<{ redirect?: string }> };

export default async function LoginPage({ searchParams }: SearchParams) {
  const { redirect: redirectTo } = await searchParams;
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(circle_at_top,#1f2f4f_0%,#111828_40%,#0a0f1b_100%)] px-4">
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">BotOps Dashboard</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to continue</p>
        </div>
        <LoginForm redirectTo={redirectTo ?? "/"} />
      </div>
    </div>
  );
}
