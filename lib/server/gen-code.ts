import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

const CODE_TTL = 60 * 60 * 24;

export function generateCode(prefix: "DUNG" | "MODS"): string {
  const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${rand()}-${rand()}`;
}

export async function createCode(prefix: "DUNG" | "MODS"): Promise<string> {
  const code = generateCode(prefix);
  await kv.set(`code:${code}`, { type: prefix === "MODS" ? "mods" : "normal" }, { ex: CODE_TTL });
  return code;
}
