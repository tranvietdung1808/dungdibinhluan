import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from 'next/server';

export async function GET() {
    // Khởi tạo kết nối tới Cloudflare R2 bằng thông tin từ .env.local
    const s3Client = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT, 
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID!, 
            secretAccessKey: process.env.SECRET_ACCESS_KEY!,
        },
    });

    try {
        const command = new HeadObjectCommand({
            Bucket: "fc26download", // Tên bucket bạn đã tạo trên Cloudflare
            Key: "FC26.rar",         // Tên file rclone đang tải lên
        });

        const metadata = await s3Client.send(command);
        
        // Tính toán dung lượng file từ Byte sang GB
        const sizeInGB = (metadata.ContentLength! / (1024 * 1024 * 1024)).toFixed(2);

        return NextResponse.json({ 
            exists: true, 
            size: `${sizeInGB} GB`,
            lastModified: metadata.LastModified 
        });
    } catch (error) {
        // Nếu file chưa lên xong hoặc không tìm thấy, trả về exists: false
        return NextResponse.json({ exists: false });
    }
}