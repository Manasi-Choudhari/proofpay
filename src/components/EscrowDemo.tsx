import { CheckIcon } from "@/components/Icons";

const criteria = ["Hero shows the brand name", "Tagline text is present", "Layout adapts to mobile"];

export default function EscrowDemo() {
  return (
    <div className="relative mx-auto w-full max-w-md text-left" aria-hidden>
      <div className="absolute -inset-6 rounded-[2rem] bg-sky-500/10 blur-2xl" />
      <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-sky-950/50 backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-mono tracking-wider text-slate-500">MILESTONE 1</div>
            <div className="mt-0.5 font-semibold">Hero section &amp; mobile layout</div>
          </div>
          <div className="text-right">
            <div className="font-semibold">$150.00</div>
            <div className="relative mt-1 h-5 w-36">
              <span className="demo-pill-held absolute right-0 rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-300">
                Held in PayPal
              </span>
              <span className="demo-pill-paid absolute right-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300">
                Captured · paid out
              </span>
            </div>
          </div>
        </div>

        <ul className="mt-4 space-y-2.5">
          {criteria.map((c, i) => (
            <li key={c} className="flex items-center gap-2.5 text-sm text-slate-300">
              <span className="relative grid h-5 w-5 place-items-center rounded-full border border-white/15">
                <span className={`demo-check demo-check-${i + 1} absolute inset-0 grid place-items-center rounded-full bg-emerald-400 text-slate-950`}>
                  <CheckIcon className="h-3 w-3" />
                </span>
              </span>
              {c}
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="demo-dot h-1.5 w-1.5 rounded-full bg-violet-400" /> AI verifier
            </span>
            <span className="font-mono">confidence 99%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="demo-bar h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-slate-500">
          <span>PayPal capture</span>
          <span className="demo-txn text-emerald-300">5F532625BF5970631</span>
        </div>
      </div>
    </div>
  );
}
