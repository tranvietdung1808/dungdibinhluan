import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

export async function GET(request: Request) {
    // Chống bot tạo presigned URL hàng loạt: tối đa 60 lần / phút / IP
    if (await isRateLimited(`rl:download-game:${clientIp(request)}`, 60, 60)) {
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
            Bucket: "fc26download", // Tên bucket của bạn
            Key: "FC26.rar",         // Tên file trên R2
        });

        // Tạo link tải có hiệu lực trong 1 giờ (3600 giây)
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return NextResponse.json({ url });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi tạo link" }, { status: 500 });
    }
}