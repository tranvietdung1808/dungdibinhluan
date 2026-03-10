import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

export async function POST(req: Request) {
  const { adminKey, type } = await req.json();

  if (adminKey !== process.env.ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefix = type === "mods" ? "MODS" : "DUNG";
  const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `${prefix}-${rand()}-${rand()}`;

  await kv.set(`code:${code}`, { used: false, type }, { ex: 60 * 60 * 24 * 30 });

  return Response.json({ code });
}
