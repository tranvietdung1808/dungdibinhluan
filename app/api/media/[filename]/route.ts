import { GetObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { createR2Client } from '@/utils/r2'

const KEY_SAFE = /^[0-9]+-[a-z0-9]+\.[a-z0-9]+$/i

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename: raw } = await params
  const filename = decodeURIComponent(raw)

  if (!KEY_SAFE.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const bucketName = process.env.R2_BUCKET_NAME || 'dungdibinhluan-images'

  try {
    const r2 = createR2Client()
    const out = await r2.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: filename,
      })
    )

    if (!out.Body) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const buf = await out.Body.transformToByteArray()
    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        'Content-Type': out.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e: unknown) {
    const err = e as { name?: string; $metadata?: { httpStatusCode?: number } }
    if (
      err.name === 'NoSuchKey' ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('Media GET error:', e)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}
