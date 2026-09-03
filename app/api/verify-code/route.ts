import { Redis } from "@upstash/redis";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

const kv = Redis.fromEnv();

export async function POST(req: Request) {
  const { code } = await req.json();

  // Chống brute-force/abuse: tối đa 20 lần thử / 5 phút / IP
  if (await isRateLimited(`rl:verify-code:${clientIp(req)}`, 20, 300)) {
    return Response.json(
      { valid: false, message: "Bạn thử mã quá nhiều lần, vui lòng thử lại sau 5 phút." },
      { status: 429 }
    );
  }

  const stored = await kv.get<{ type: string }>(`code:${code}`);

  if (!stored) {
    return Response.json({ valid: false });
  }

  return Response.json({ valid: true, type: stored.type ?? "normal" });
}
