'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { useEffect, useRef, useState } from 'react'

// =====================================================
// RichTextEditor — toolbar thống nhất (§16.5)
// Đậm · Nghiêng · H2 · H3 · danh sách · ảnh (bắt buộc
// alt text) · undo/redo. Nút có aria-pressed + aria-label.
// Không có "Lưu nháp"/"Đã lưu tự động" — backend không có.
// =====================================================

interface RichTextEditorProps {
  content?: string
  initialContent?: string
  onChange: (content: string) => void
}

const MAX_UPLOAD_MB = 5
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])

function ToolbarButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition-colors disabled:opacity-40 ${
        pressed
          ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
          : 'text-[var(--color-body)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-title)]'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ content, initialContent, onChange }: RichTextEditorProps) {
  const initialValue = content || initialContent || ''
  const [uploadError, setUploadError] = useState('')
  const [, setTick] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc pl-6',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal pl-6',
        },
      }),
      ListItem,
    ],
    content: initialValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none min-h-[200px] focus:outline-none p-4 bg-[var(--color-surface-1)] text-[var(--color-body)]',
      },
    },
  })

  // Re-render khi state editor đổi để cập nhật aria-pressed/canUndo
  useEffect(() => {
    if (!editor) return
    const rerender = () => setTick((t) => t + 1)
    editor.on('transaction', rerender)
    return () => {
      editor.off('transaction', rerender)
    }
  }, [editor])

  if (!editor) {
    return null
  }

  const pickImage = () => {
    setUploadError('')
    fileInputRef.current?.click()
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_MIME.has(file.type)) {
      setUploadError(`"${file.name}" không đúng định dạng — chỉ nhận JPEG, PNG, GIF hoặc WebP.`)
      return
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUploadError(`"${file.name}" vượt quá ${MAX_UPLOAD_MB}MB.`)
      return
    }

    // Ảnh bắt buộc có alt text (§16.5)
    const alt = window
      .prompt('Mô tả ảnh (alt text) — bắt buộc cho người dùng đọc màn hình:', file.name.replace(/\.[^.]+$/, ''))
      ?.trim()
    if (!alt) {
      setUploadError('Ảnh chưa được chèn vì thiếu mô tả (alt text).')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok && data?.url) {
        editor.chain().focus().setImage({ src: data.url, alt }).run()
      } else {
        setUploadError(data?.error || 'Ảnh chưa tải lên được. Vui lòng thử lại.')
      }
    } catch {
      setUploadError('Ảnh chưa tải lên được. Vui lòng thử lại.')
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-line)]">
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Định dạng nội dung"
        className="flex flex-wrap items-center gap-1 border-b border-[var(--color-line)] bg-[var(--color-surface-2)] p-2"
      >
        <ToolbarButton
          label="In đậm"
          pressed={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span aria-hidden="true" className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          label="In nghiêng"
          pressed={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span aria-hidden="true" className="italic">I</span>
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden="true" />

        <ToolbarButton
          label="Tiêu đề mức 2"
          pressed={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Tiêu đề mức 3"
          pressed={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden="true" />

        <ToolbarButton
          label="Danh sách gạch đầu dòng"
          pressed={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
            <path d="M8 6h13M8 12h13M8 18h13" />
            <circle cx="4" cy="6" r="1" fill="currentColor" />
            <circle cx="4" cy="12" r="1" fill="currentColor" />
            <circle cx="4" cy="18" r="1" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          label="Danh sách đánh số"
          pressed={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden="true" />

        <ToolbarButton label="Chèn ảnh (cần mô tả alt)" onClick={pickImage}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden="true" />

        <ToolbarButton
          label="Hoàn tác"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          label="Làm lại"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
          </svg>
        </ToolbarButton>
      </div>

      {uploadError && (
        <p role="alert" className="border-b border-[var(--color-line)] bg-[var(--color-danger-subtle)] px-4 py-2 text-xs text-[var(--color-danger)]">
          {uploadError}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleImageFile}
        className="sr-only"
        aria-label="Chọn ảnh chèn vào bài viết"
      />

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
