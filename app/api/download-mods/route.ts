import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';

export async function GET() {
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
