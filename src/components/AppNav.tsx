"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/jobs", label: "Human jobs" },
  { href: "/app/missions", label: "Agent missions" },
  { href: "/app/marketplace", label: "Marketplace" },
  { href: "/app/ledger", label: "Ledger" },
];

export default function AppNav() {
  const path = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-1 text-sm">
      {links.map((l) => {
        const active = l.href === "/app" ? path === "/app" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 transition ${active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
