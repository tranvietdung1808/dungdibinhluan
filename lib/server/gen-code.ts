import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

const CODE_TTL = 60 * 60 * 24;

export type CodePrefix = "FC27" | "DUNG" | "MODS";

export function generateCode(prefix: CodePrefix): string {
  const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${rand()}-${rand()}`;
}

export async function createCode(
  prefix: CodePrefix,
  productId?: string,
): Promise<string> {
  const code = generateCode(prefix);
  await kv.set(
    `code:${code}`,
    {
      type: prefix === "MODS" ? "mods" : "normal",
      productId: productId ?? null,
    },
    { ex: CODE_TTL },
  );
  return code;
}
