import { NextResponse } from 'next/server'

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function successResponse<T>(payload: T, status = 200) {
  return NextResponse.json(payload, { status })
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export async function runRoute(
  handler: () => Promise<NextResponse>,
  fallbackMessage = 'Internal server error'
) {
  try {
    return await handler()
  } catch (error) {
    console.error(error)
    return errorResponse(fallbackMessage, 500)
  }
}
