import { NextRequest, NextResponse } from 'next/server'
import { clientIp, isRateLimited } from '@/lib/server/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Chống brute-force: tối đa 30 lần thử / 15 phút / IP
    if (await isRateLimited(`rl:admin-login:${clientIp(request)}`, 30, 900)) {
      return NextResponse.json(
        { error: 'Quá nhiều lần thử, vui lòng thử lại sau 15 phút' },
        { status: 429 }
      )
    }

    // Chống thử mật khẩu liên tục: tối đa 5 lần / phút / IP
    if (await isRateLimited(`rl:admin-login-fast:${clientIp(request)}`, 5, 60)) {
      return NextResponse.json(
        { error: 'Thử lại sau 1 phút' },
        { status: 429 }
      )
    }

    const { password } = await request.json()
    
    const adminSecret = process.env.ADMIN_SECRET
    
    if (!adminSecret) {
      return NextResponse.json(
        { error: 'ADMIN_SECRET not configured' },
        { status: 500 }
      )
    }
    
    if (password === adminSecret) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
