import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import EditGuideForm from './EditGuideForm'

interface Guide {
  id: string
  title: string
  slug: string
  content: string
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  
  const { data: guide, error } = await supabase
    .from('guides')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !guide) {
    console.error('Error fetching guide:', error)
    notFound()
  }

  const guideData = guide as Guide

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111111] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <a 
              href="/admin/guides"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Quay lại
            </a>
            <h1 className="text-xl font-bold">Sửa bài viết</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EditGuideForm guide={guideData} />
      </div>
    </div>
  )
}
