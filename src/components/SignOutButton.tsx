"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="rounded-lg border border-white/15 px-2.5 py-1 hover:bg-white/5"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
