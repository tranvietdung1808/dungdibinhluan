import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Get single mod by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { data, error } = await supabaseAdmin
      .from('mods')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Mod not found' },
        { status: 404 }
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

// PUT - Update mod by slug
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    
    const {
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

    // Check if mod exists
    const { data: existing } = await supabaseAdmin
      .from('mods')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: `Mod "${slug}" not found` },
        { status: 404 }
      )
    }

    // Update mod
    const { data, error } = await supabaseAdmin
      .from('mods')
      .update({
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
      .eq('slug', slug)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update mod: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete mod by slug
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Check if mod exists
    const { data: existing } = await supabaseAdmin
      .from('mods')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: `Mod "${slug}" not found` },
        { status: 404 }
      )
    }

    // Delete mod
    const { error } = await supabaseAdmin
      .from('mods')
      .delete()
      .eq('slug', slug)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete mod: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
