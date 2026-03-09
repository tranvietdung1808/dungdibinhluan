// app/api/download/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Link mới cập nhật từ Hetzner (Singapore) để test tải file
        const testFileUrl = "https://sin-speed.hetzner.com/100MB.bin";
        
        return NextResponse.json({ url: testFileUrl });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi tạo link tải" }, { status: 500 });
    }
}