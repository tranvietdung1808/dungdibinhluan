import { Redis } from "@upstash/redis";

// =====================================================
// Rate limit đơn giản trên Upstash Redis (serverless-safe)
// - Fail-open: nếu Redis lỗi/missing env → cho phép request (không chặn nhầm)
// =====================================================

let kv: Redis | null | undefined;

function getKv(): Redis | null {
  if (kv !== undefined) return kv;
  try {
    kv = Redis.fromEnv();
  } catch {
    kv = null;
  }
  return kv;
}

// Trả true nếu vượt giới hạn
export async function isRateLimited(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const client = getKv();
  if (!client) return false;

  try {
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, windowSeconds);
    return count > limit;
  } catch {
    return false;
  }
}

export function clientIp(request: Request): string {
  // Ưu tiên IP thật do Vercel ghi đè (chống giả mạo x-forwarded-for)
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}
