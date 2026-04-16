import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

export async function POST(req: Request) {
  const { code } = await req.json();
  const stored = await kv.get<{ type: string }>(`code:${code}`);

  if (!stored) {
    return Response.json({ valid: false });
  }

  return Response.json({ valid: true, type: stored.type ?? "normal" });
}
