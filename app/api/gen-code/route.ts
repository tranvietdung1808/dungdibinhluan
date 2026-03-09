import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `DUNG-${seg()}-${seg()}`;
}

export async function POST(req: NextRequest) {
  // Bảo vệ bằng admin key
  const { adminKey } = await req.json();
  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = generateCode();
  // Lưu vào Redis, chưa active (chưa có TTL)
  await redis.set(`code:${code}`, "unused");

  return NextResponse.json({ code });
}
