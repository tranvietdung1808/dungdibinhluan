import { createClient } from '@/utils/supabase/server'
import { resolveThumbnailSrc } from '@/utils/r2'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 120

type Guide = {
  id: string
  title: string
  slug: string
  content: string
  thumbnail_url: string | null
  author_id: string
  created_at: string
  updated_at: string
}

export default async function GuidesPage() {
  const supabase = createClient()
  
  try {
    const { data: guides, error } = await supabase
      .from('guides')
      .select(`
        *,
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching guides:', error)
      return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">HƯỚNG DẪN/MẸO</h1>
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400">Lỗi khi tải bài viết: {error.message}</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#ce5a67]/10 to-transparent">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-[#ce5a67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h1 className="text-4xl font-black tracking-wider">HƯỚNG DẪN/MẸO</h1>
            </div>
            <p className="text-slate-400 text-lg">
              Tổng hợp các bài hướng dẫn và mẹo hữu ích cho game thủ
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          {guides && guides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide: any) => {
                const thumbSrc = resolveThumbnailSrc(guide.thumbnail_url)
                return (
                <Link 
                  key={guide.id} 
                  href={`/huong-dan/${guide.slug}`}
                  className="group block bg-[#111111] border border-white/5 rounded-xl overflow-hidden hover:border-[#ce5a67]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]"
                >
                  {/* Thumbnail */}
                  {thumbSrc ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={thumbSrc}
                        alt=""
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-[#ce5a67]/20 to-[#ce5a67]/5">
                      <svg className="w-12 h-12 text-[#ce5a67]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-[#ce5a67] transition-colors">
                      {guide.title}
                    </h3>
                    
                    {/* Content preview */}
                    <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                      {guide.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>

                    {/* Author and date */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        {guide.profiles?.avatar_url ? (
                          <Image
                            src={guide.profiles.avatar_url}
                            alt={guide.profiles.username || 'Author'}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#ce5a67]/20" />
                        )}
                        <span>{guide.profiles?.username || 'Admin'}</span>
                      </div>
                      <span>
                        {new Date(guide.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">Chưa có bài viết nào</h3>
              <p className="text-slate-400">
                Hiện tại chưa có bài hướng dẫn nào. Hãy quay lại sau nhé!
              </p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">HƯỚNG DẪN/MẸO</h1>
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400">Lỗi kết nối: Vui lòng kiểm tra cấu hình Supabase</p>
          </div>
        </div>
      </div>
    )
  }
}
