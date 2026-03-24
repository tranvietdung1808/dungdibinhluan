import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = () => {
  // Temporarily hardcode to test connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ppyhxsprmebkudevgwql.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBweWh4c3BybWVia3VkZXZnd3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDAzNTgsImV4cCI6MjA4OTg3NjM1OH0.R9oNius2qBGjQ5HmptqEa9tu6mrAn9Cj9JMI66I-nlY'
  
  console.log('Environment check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseAnonKey?.length,
    allEnvVars: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('NEXT_PUBLIC')
    )
  })
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl?.substring(0, 20) + '...',
      key: supabaseAnonKey?.substring(0, 20) + '...'
    })
    throw new Error(`Missing Supabase environment variables. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`)
  }
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
