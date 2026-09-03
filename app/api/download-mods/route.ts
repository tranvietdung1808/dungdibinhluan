import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

export async function GET(request: Request) {
    // Chống bot tạo presigned URL hàng loạt: tối đa 60 lần / phút / IP
    if (await isRateLimited(`rl:download-mods:${clientIp(request)}`, 60, 60)) {
        return NextResponse.json({ error: "Quá nhiều yêu cầu tải, thử lại sau" }, { status: 429 });
    }

    const s3Client = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID!,
            secretAccessKey: process.env.SECRET_ACCESS_KEY!,
        },
    });

    try {
        const command = new GetObjectCommand({
            Bucket: "fc26download",
            Key: "FC26-MODS.rar", // ← đổi tên file mods sau khi upload
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return NextResponse.json({ url });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi tạo link" }, { status: 500 });
    }
}
