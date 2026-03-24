import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json()
    
    if (!adminKey) {
      return NextResponse.json(
        { error: 'Admin key is required' },
        { status: 400 }
      )
    }

    // Verify against ADMIN_KEY from env
    const validKey = process.env.ADMIN_SECRET
    
    if (!validKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (adminKey === validKey) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid admin key' },
        { status: 401 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
