import { promises as dns } from "dns";
import { promises as fs } from "fs";
import net from "net";
import path from "path";

const MAX_PAGE_CHARS = 40_000;
const MAX_BYTES = 1_000_000;
const MAX_REDIRECTS = 3;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("URL points to a private or internal network address");
  }
}

const clean = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\s+/g, " ")
    .slice(0, MAX_PAGE_CHARS);

/** Bundled demo deliverables are read from disk instead of over the network. */
async function readSample(pathname: string): Promise<string | null> {
  const m = pathname.match(/^\/samples\/([a-z0-9-]+\.html)$/i);
  if (!m) return null;
  try {
    return await fs.readFile(path.join(process.cwd(), "public", "samples", m[1]), "utf8");
  } catch {
    return null;
  }
}

export async function fetchDeliverable(rawUrl: string, origin: string): Promise<string> {
  let url = new URL(rawUrl, origin);
  if (url.origin === new URL(origin).origin || rawUrl.startsWith("/")) {
    const sample = await readSample(url.pathname);
    if (sample) return clean(sample);
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http(s) URLs are allowed");
    await assertPublicHost(url.hostname);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "ProofPay-Verifier/1.0" },
        redirect: "manual",
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = new URL(res.headers.get("location")!, url);
        continue;
      }
      if (!res.ok) return `[Could not load page: HTTP ${res.status}]`;
      const buf = await res.arrayBuffer();
      return clean(new TextDecoder().decode(buf.slice(0, MAX_BYTES)));
    } catch (e) {
      if ((e as Error).name === "AbortError") return "[Could not load page: timed out]";
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Too many redirects");
}
