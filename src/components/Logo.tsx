import Link from "next/link";

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-slate-950 font-black">
        P
      </span>
      ProofPay
    </Link>
  );
}
