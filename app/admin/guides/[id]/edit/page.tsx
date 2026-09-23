import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { AdminPage } from '../../../components/AdminPage'
import { GuideForm, type GuideFormState } from '../../../components/guides/GuideForm'

interface Guide {
  id: string
  title: string
  slug: string
  content: string
  thumbnail_url: string | null
  tags: string[]
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
    notFound()
  }

  const g = guide as Guide
  const initial: GuideFormState = {
    title: g.title,
    slug: g.slug,
    thumbnailUrl: g.thumbnail_url ?? '',
    tags: g.tags ?? [],
    content: g.content,
  }

  return (
    <AdminPage size="form">
      <GuideForm mode="edit" guideId={g.id} initial={initial} />
    </AdminPage>
  )
}
