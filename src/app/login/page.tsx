import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  if (await getSession()) redirect("/app");
  return (
    <div className="flex-1 grid place-items-center px-6 py-16 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_60%)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <LoginForm />
        <p className="text-center text-xs text-slate-500">
          Passwordless sign-in with a one-time code. Codes expire in 10 minutes and allow 5 attempts.
        </p>
      </div>
    </div>
  );
}
