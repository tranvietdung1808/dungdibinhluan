import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ valid: false, message: "Thiếu mã" });

  const key = `code:${code.trim().toUpperCase()}`;
  const status = await redis.get(key);

  if (!status) {
    return NextResponse.json({ valid: false, message: "Mã không tồn tại!" });
  }

  if (status === "unused") {
    // Lần đầu dùng → kích hoạt TTL 4 tiếng (14400 giây)
    await redis.set(key, "active", { ex: 14400 });
    return NextResponse.json({ valid: true, message: "Kích hoạt thành công!" });
  }

  if (status === "active") {
    // Vẫn còn hạn
    return NextResponse.json({ valid: true, message: "Còn hạn" });
  }

  // TTL hết → key tự xóa → status null → bắt ở trên rồi
  return NextResponse.json({ valid: false, message: "Mã đã hết hạn!" });
}
