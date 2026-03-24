import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - List all mods
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('mods')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch mods' },
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

// POST - Create new mod
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      slug,
      name,
      author,
      category,
      version,
      updated_at,
      description,
      long_description,
      thumbnail,
      download_url,
      tags,
      thumbnail_orientation,
      featured,
      video_id,
    } = body

    // Validate required fields
    if (!slug || !name || !author || !version || !updated_at) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, author, version, updated_at' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('mods')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${slug}" already exists` },
        { status: 409 }
      )
    }

    // Insert new mod
    const { data, error } = await supabaseAdmin
      .from('mods')
      .insert({
        slug,
        name,
        author,
        category: category || 'Faces',
        version,
        updated_at,
        description: description || '',
        long_description: long_description || '',
        thumbnail: thumbnail || null,
        download_url: download_url || null,
        tags: tags || [],
        thumbnail_orientation: thumbnail_orientation || 'portrait',
        featured: featured || false,
        video_id: video_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating mod:', error)
      return NextResponse.json(
        { error: 'Failed to create mod: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
