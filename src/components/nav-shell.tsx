import Link from "next/link";
import { Activity, Bot, Command, Home, LogOut, Settings2 } from "lucide-react";

import { signOutAction } from "@/app/auth-actions";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/commands", label: "Commands", icon: Command },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-[radial-gradient(circle_at_top,#1f2f4f_0%,#111828_40%,#0a0f1b_100%)] text-slate-100">
      <aside className="hidden w-64 border-r border-white/10 bg-white/5 p-6 backdrop-blur lg:block">
        <div className="mb-8 flex items-center gap-2">
          <div className="rounded-xl bg-emerald-400/20 p-2 text-emerald-300">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">BotOps</p>
            <p className="text-lg font-semibold text-white">Dashboard</p>
          </div>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
          <form action={signOutAction} className="pt-4">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              <LogOut size={16} />
              Log out
            </button>
          </form>
        </nav>
      </aside>

      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-900/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-slate-200 transition active:bg-white/10"
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
            <form action={signOutAction} className="flex flex-col items-center gap-1">
              <button
                type="submit"
                className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-slate-200 transition active:bg-white/10"
              >
                <LogOut size={15} />
                Log out
              </button>
            </form>
          </div>
        </nav>
      </div>
    </div>
  );
}
