import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get single guide by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching guide:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update guide
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, slug, content, thumbnail_url } = await request.json()

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if new slug conflicts with other guides
    const { data: existingGuide } = await supabase
      .from('guides')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single()

    if (existingGuide) {
      return NextResponse.json(
        { error: 'Slug already exists for another guide' },
        { status: 409 }
      )
    }

    // Update guide
    const { data, error } = await supabase
      .from('guides')
      .update({
        title,
        slug,
        content,
        thumbnail_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating guide:', error)
      return NextResponse.json(
        { error: 'Failed to update guide: ' + error.message },
        { status: 500 }
      )
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return NextResponse.json(
        { error: 'Guide not found or update returned no row' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error('Error in PUT /api/admin/guides/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete guide
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting guide:', error)
      return NextResponse.json(
        { error: 'Failed to delete guide: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/guides/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
