export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
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
      community_comments: {
        Row: {
          id: string
          scope_type: string
          scope_id: string
          parent_id: string | null
          user_id: string | null
          author_name: string
          author_avatar: string | null
          content: string
          is_admin_comment: boolean
          is_pinned: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scope_type: string
          scope_id: string
          parent_id?: string | null
          user_id?: string | null
          author_name: string
          author_avatar?: string | null
          content: string
          is_admin_comment?: boolean
          is_pinned?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          scope_type?: string
          scope_id?: string
          parent_id?: string | null
          user_id?: string | null
          author_name?: string
          author_avatar?: string | null
          content?: string
          is_admin_comment?: boolean
          is_pinned?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      player_catalog_releases: {
        Row: {
          id: string
          export_id: string
          game_version: string
          data_date: string | null
          manifest: Record<string, unknown>
          record_count: number
          status: string
          imported_at: string
          activated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          export_id: string
          game_version: string
          data_date?: string | null
          manifest?: Record<string, unknown>
          record_count: number
          status?: string
          imported_at?: string
          activated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          export_id?: string
          game_version?: string
          data_date?: string | null
          manifest?: Record<string, unknown>
          record_count?: number
          status?: string
          imported_at?: string
          activated_at?: string | null
          created_at?: string
        }
      }
      player_catalog_entries: {
        Row: {
          release_id: string
          ea_player_id: number
          slug: string
          display_name: string
          search_name: string
          common_name: string | null
          overall_rating: number
          potential: number | null
          birthdate: string | null
          height_cm: number | null
          weight_kg: number | null
          preferred_foot: number | null
          skill_moves: number | null
          weak_foot: number | null
          league_name: string | null
          team_id: number | null
          team_name: string | null
          nationality_id: number | null
          nationality_name: string | null
          gender: number | null
          position_short: string | null
          alt_positions: string[]
          stats: Record<string, number>
          avatar_url: string | null
          base_value_eur: number | null
          base_value_kind: string
          valuation_date: string | null
          valuation_source_name: string | null
          valuation_source_url: string | null
          adjustment_bps: number
          is_top_potential: boolean
          reference_value_eur: number | null
          weekly_wage_eur: number | null
          wage_basis: string
        }
        Insert: {
          release_id: string
          ea_player_id: number
          slug: string
          display_name: string
          search_name: string
          common_name?: string | null
          overall_rating: number
          potential?: number | null
          birthdate?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          preferred_foot?: number | null
          skill_moves?: number | null
          weak_foot?: number | null
          league_name?: string | null
          team_id?: number | null
          team_name?: string | null
          nationality_id?: number | null
          nationality_name?: string | null
          gender?: number | null
          position_short?: string | null
          alt_positions?: string[]
          stats?: Record<string, number>
          avatar_url?: string | null
          base_value_eur?: number | null
          base_value_kind?: string
          valuation_date?: string | null
          valuation_source_name?: string | null
          valuation_source_url?: string | null
          adjustment_bps?: number
          is_top_potential?: boolean
          reference_value_eur?: number | null
          weekly_wage_eur?: number | null
          wage_basis?: string
        }
        Update: {
          release_id?: string
          ea_player_id?: number
          slug?: string
          display_name?: string
          search_name?: string
          common_name?: string | null
          overall_rating?: number
          potential?: number | null
          birthdate?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          preferred_foot?: number | null
          skill_moves?: number | null
          weak_foot?: number | null
          league_name?: string | null
          team_id?: number | null
          team_name?: string | null
          nationality_id?: number | null
          nationality_name?: string | null
          gender?: number | null
          position_short?: string | null
          alt_positions?: string[]
          stats?: Record<string, number>
          avatar_url?: string | null
          base_value_eur?: number | null
          base_value_kind?: string
          valuation_date?: string | null
          valuation_source_name?: string | null
          valuation_source_url?: string | null
          adjustment_bps?: number
          is_top_potential?: boolean
          reference_value_eur?: number | null
          weekly_wage_eur?: number | null
          wage_basis?: string
        }
      }
    }
  }
}
