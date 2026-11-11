import Logo from "@/components/Logo";
import AppNav from "@/components/AppNav";
import SignOutButton from "@/components/SignOutButton";
import { requirePageSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession();
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Logo href="/app" />
            <AppNav />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden md:inline rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
              PayPal sandbox
            </span>
            <span className="hidden sm:inline">{session.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
