import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProofPay: AI escrow that pays when the work is proven",
  description: "An AI agent that holds payment in PayPal escrow and releases it only when the work is verified.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-slate-950 font-black">
                P
              </span>
              ProofPay
            </Link>
            <span className="text-xs text-slate-400">
              AI escrow on <span className="text-sky-300 font-medium">PayPal</span> · Sandbox
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
          Built for the PayPal AI Hackathon · PayPal Orders &amp; Payments APIs + Gemini
        </footer>
      </body>
    </html>
  );
}
