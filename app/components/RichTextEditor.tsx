'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import { useState } from 'react'

interface RichTextEditorProps {
  content?: string
  initialContent?: string
  onChange: (content: string) => void
}

export default function RichTextEditor({ content, initialContent, onChange }: RichTextEditorProps) {
  const initialValue = content || initialContent || ''

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
        class: 'prose prose-invert max-w-none min-h-[200px] focus:outline-none p-4 bg-[#111111] rounded-lg',
      },
    },
  })

  if (!editor) {
    return null
  }

  const addImage = () => {
    // Create file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Show loading state
      const loadingText = 'Đang upload ảnh...'
      
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            editor.chain().focus().setImage({ src: data.url, alt: '' }).run()
          } else {
            alert('Upload failed: ' + data.error)
          }
        } else {
          const errorData = await response.json()
          alert('Upload failed: ' + errorData.error)
        }
      } catch (error) {
        alert('Upload failed: ' + error)
      }
    }
    input.click()
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-[#1a1a1a] border-b border-white/10 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('bold') 
              ? 'bg-[#ce5a67] text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('italic') 
              ? 'bg-[#ce5a67] text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 1 }) 
              ? 'bg-[#ce5a67] text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 2 }) 
              ? 'bg-[#ce5a67] text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('bulletList') 
              ? 'bg-[#ce5a67] text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            editor.isActive('orderedList') 
              ? 'bg-[#ce5a67] text-white' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Numbered List
        </button>
        <button
          type="button"
          onClick={addImage}
          className="px-3 py-1 rounded text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Thêm ảnh
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
