"use client";

import { usePathname } from "next/navigation";

import { NavShell } from "@/components/nav-shell";

export function LayoutAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <>{children}</>;
  }
  return <NavShell>{children}</NavShell>;
}
