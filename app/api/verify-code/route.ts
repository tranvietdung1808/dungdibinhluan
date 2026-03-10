import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

export async function POST(req: Request) {
  const { code } = await req.json();
  const stored = await kv.get<{ used: boolean; type: string }>(`code:${code}`);

  if (!stored || stored.used) {
    return Response.json({ valid: false });
  }

  await kv.set(`code:${code}`, { ...stored, used: true });
  return Response.json({ valid: true, type: stored.type ?? "normal" });
}
