import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch guides' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, slug, content, thumbnail_url } = await request.json()
    
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Check if slug already exists
    const { data: existingGuide } = await supabase
      .from('guides')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (existingGuide) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      )
    }

    // Create new guide with hardcoded admin author
    const { data, error } = await supabase
      .from('guides')
      .insert([
        {
          title,
          slug,
          content,
          thumbnail_url,
          author_id: '00000000-0000-0000-0000-000000000001', // Hardcoded admin author
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating guide:', error)
      return NextResponse.json(
        { error: 'Failed to create guide: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in POST /api/admin/guides:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
