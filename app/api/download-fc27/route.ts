import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

const kv = Redis.fromEnv();

/**
 * Placeholder R2 cho FC 27.
 * Có thể upload trực tiếp `FC27.rar` vào bucket `fc27download`, hoặc cấu hình:
 * - R2_FC27_BUCKET
 * - R2_FC27_GAME_KEY
 */
const FC27_BUCKET = process.env.R2_FC27_BUCKET || "fc27download";
const FC27_GAME_KEY = process.env.R2_FC27_GAME_KEY || "FC27.rar";

export async function GET(request: NextRequest) {
  if (await isRateLimited(`rl:download-fc27:${clientIp(request)}`, 30, 60)) {
    return NextResponse.json(
      { error: "Bạn tạo liên kết quá nhiều lần, vui lòng thử lại sau." },
      { status: 429 },
    );
  }

  const accessCode = request.cookies.get("fc27_access")?.value;
  if (!accessCode) {
    return NextResponse.json(
      { error: "Vui lòng nhập mã FC 27 để mở khu tải trước." },
      { status: 401 },
    );
  }

  const stored = await kv.get<{ productId?: string | null }>(
    `code:${accessCode}`,
  );
  if (stored?.productId !== "fc27-standard") {
    return NextResponse.json(
      { error: "Phiên truy cập FC 27 không hợp lệ hoặc đã hết hạn." },
      { status: 403 },
    );
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });

  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: FC27_BUCKET, Key: FC27_GAME_KEY }),
      { expiresIn: 3600 },
    );
    return NextResponse.json({ url });
  } catch (error) {
    console.error("FC27 signed URL error:", error);
    return NextResponse.json(
      {
        error:
          "Chưa tạo được link FC 27. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
      },
      { status: 500 },
    );
  }
}
