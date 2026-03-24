import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    // Check all possible environment variables
    const envCheck = {
      // NEXT_PUBLIC_ variables
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      
      // Non-public variables
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
      ADMIN_SECRET: process.env.ADMIN_SECRET ? 'SET' : 'NOT_SET',
      
      // All environment variables (filtered)
      allEnvVars: Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || 
        key.includes('NEXT_PUBLIC') || 
        key.includes('ADMIN')
      ),
      
      // Raw environment check
      rawEnv: {
        NODE_ENV: process.env.NODE_ENV,
      }
    }

    // Try to create client
    let client = null
    let clientError = null
    
    try {
      client = createClient()
    } catch (error) {
      clientError = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      environment: envCheck,
      clientCreation: {
        success: !!client,
        error: clientError
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
