import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

export async function GET(req: NextRequest) {
  const orderCode = req.nextUrl.searchParams.get("orderCode");
  if (!orderCode) {
    return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });
  }

  const order = await kv.get(`order:${orderCode}`);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
