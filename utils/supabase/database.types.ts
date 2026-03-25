export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      guides: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          thumbnail_url: string | null
          tags: string[]
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: string
          thumbnail_url?: string | null
          tags?: string[]
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string
          thumbnail_url?: string | null
          tags?: string[]
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      mods: {
        Row: {
          id: string
          slug: string
          name: string
          author: string
          category: string
          version: string
          updated_at: string
          description: string | null
          long_description: string | null
          thumbnail: string | null
          download_url: string | null
          tags: string[]
          thumbnail_orientation: string
          featured: boolean
          video_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          author: string
          category?: string
          version: string
          updated_at: string
          description?: string | null
          long_description?: string | null
          thumbnail?: string | null
          download_url?: string | null
          tags?: string[]
          thumbnail_orientation?: string
          featured?: boolean
          video_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          author?: string
          category?: string
          version?: string
          updated_at?: string
          description?: string | null
          long_description?: string | null
          thumbnail?: string | null
          download_url?: string | null
          tags?: string[]
          thumbnail_orientation?: string
          featured?: boolean
          video_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
