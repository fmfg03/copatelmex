export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_players_per_team: number | null
          name: string
          registration_closed: boolean
          year_born: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_players_per_team?: number | null
          name: string
          registration_closed?: boolean
          year_born?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_players_per_team?: number | null
          name?: string
          registration_closed?: boolean
          year_born?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      email_inbox: {
        Row: {
          attachments: Json | null
          created_at: string
          from_email: string
          from_name: string | null
          html_content: string | null
          id: string
          is_read: boolean
          replied_at: string | null
          subject: string | null
          text_content: string | null
          to_email: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          from_email: string
          from_name?: string | null
          html_content?: string | null
          id?: string
          is_read?: boolean
          replied_at?: string | null
          subject?: string | null
          text_content?: string | null
          to_email: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          html_content?: string | null
          id?: string
          is_read?: boolean
          replied_at?: string | null
          subject?: string | null
          text_content?: string | null
          to_email?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient_count: number
          sent_by: string
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_count?: number
          sent_by: string
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_count?: number
          sent_by?: string
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      featured_videos: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          thumbnail_url: string | null
          title: string
          video_type: string | null
          video_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title: string
          video_type?: string | null
          video_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          video_type?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          photo_date: string
          title: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          photo_date: string
          title: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          photo_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_uses: {
        Row: {
          id: string
          invitation_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          invitation_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          invitation_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_uses_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          notes: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          notes?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      live_streams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          match_id: string | null
          platform: string
          scheduled_time: string
          status: string | null
          stream_url: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          match_id?: string | null
          platform: string
          scheduled_time: string
          status?: string | null
          stream_url: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          match_id?: string | null
          platform?: string
          scheduled_time?: string
          status?: string | null
          stream_url?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_cedulas: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          match_id: string
          notes: string | null
          parsed_data: Json | null
          referee_name: string | null
          status: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          match_id: string
          notes?: string | null
          parsed_data?: Json | null
          referee_name?: string | null
          status?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          match_id?: string
          notes?: string | null
          parsed_data?: Json | null
          referee_name?: string | null
          status?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_cedulas_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          category_id: string | null
          created_at: string | null
          field_number: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          match_date: string
          phase: string | null
          status: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          category_id?: string | null
          created_at?: string | null
          field_number?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          match_date: string
          phase?: string | null
          status?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          category_id?: string | null
          created_at?: string | null
          field_number?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          match_date?: string
          phase?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          published_at: string | null
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          published_at?: string | null
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          published_at?: string | null
          title?: string
        }
        Relationships: []
      }
      player_access_log: {
        Row: {
          accessed_at: string
          action: string
          id: string
          ip_address: unknown
          player_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_at?: string
          action: string
          id?: string
          ip_address?: unknown
          player_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_at?: string
          action?: string
          id?: string
          ip_address?: unknown
          player_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_access_log_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_identification: {
        Row: {
          created_at: string
          id: string
          identification_number: string | null
          player_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          identification_number?: string | null
          player_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          identification_number?: string | null
          player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_identification_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          assists: number | null
          created_at: string | null
          goals: number | null
          id: string
          match_id: string
          player_id: string
          red_cards: number | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          match_id: string
          player_id: string
          red_cards?: number | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          created_at?: string | null
          goals?: number | null
          id?: string
          match_id?: string
          player_id?: string
          red_cards?: number | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birth_certificate_url: string | null
          birth_date: string
          created_at: string | null
          curp: string | null
          documents_complete: boolean | null
          documents_verified: boolean | null
          first_name: string
          id: string
          jersey_number: number | null
          last_name: string
          maternal_surname: string | null
          parent_email: string
          parent_name: string
          parent_phone: string
          paternal_surname: string | null
          photo_url: string | null
          position: string | null
          registration_id: string
          responsiva_url: string | null
          unique_player_id: string | null
          verification_notes: string | null
        }
        Insert: {
          birth_certificate_url?: string | null
          birth_date: string
          created_at?: string | null
          curp?: string | null
          documents_complete?: boolean | null
          documents_verified?: boolean | null
          first_name: string
          id?: string
          jersey_number?: number | null
          last_name: string
          maternal_surname?: string | null
          parent_email: string
          parent_name: string
          parent_phone: string
          paternal_surname?: string | null
          photo_url?: string | null
          position?: string | null
          registration_id: string
          responsiva_url?: string | null
          unique_player_id?: string | null
          verification_notes?: string | null
        }
        Update: {
          birth_certificate_url?: string | null
          birth_date?: string
          created_at?: string | null
          curp?: string | null
          documents_complete?: boolean | null
          documents_verified?: boolean | null
          first_name?: string
          id?: string
          jersey_number?: number | null
          last_name?: string
          maternal_surname?: string | null
          parent_email?: string
          parent_name?: string
          parent_phone?: string
          paternal_surname?: string | null
          photo_url?: string | null
          position?: string | null
          registration_id?: string
          responsiva_url?: string | null
          unique_player_id?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          category_id: string
          document_urls: Json | null
          id: string
          notes: string | null
          payment_amount: number | null
          payment_date: string | null
          payment_receipt_url: string | null
          payment_reference: string | null
          payment_status: string | null
          registration_date: string | null
          responsiva_url: string | null
          team_id: string
        }
        Insert: {
          category_id: string
          document_urls?: Json | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          registration_date?: string | null
          responsiva_url?: string | null
          team_id: string
        }
        Update: {
          category_id?: string
          document_urls?: Json | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_receipt_url?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          registration_date?: string | null
          responsiva_url?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_role: Database["public"]["Enums"]["app_role"] | null
          previous_role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          previous_role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          previous_role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          created_at: string
          created_by: string
          error_message: string | null
          html_content: string
          id: string
          recipients: Json
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string
          text_content: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          error_message?: string | null
          html_content: string
          id?: string
          recipients: Json
          scheduled_at: string
          sent_at?: string | null
          status?: string
          subject: string
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          error_message?: string | null
          html_content?: string
          id?: string
          recipients?: Json
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          text_content?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      statistics_pdf_reports: {
        Row: {
          category_id: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          jornada_number: number
          notes: string | null
          report_date: string
          uploaded_by: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          jornada_number: number
          notes?: string | null
          report_date: string
          uploaded_by?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          jornada_number?: number
          notes?: string | null
          report_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "statistics_pdf_reports_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      statistics_uploads: {
        Row: {
          category_id: string
          excel_file_name: string | null
          excel_file_path: string | null
          file_name: string | null
          id: string
          notes: string | null
          records_updated: number | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          category_id: string
          excel_file_name?: string | null
          excel_file_path?: string | null
          file_name?: string | null
          id?: string
          notes?: string | null
          records_updated?: number | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category_id?: string
          excel_file_name?: string | null
          excel_file_path?: string | null
          file_name?: string | null
          id?: string
          notes?: string | null
          records_updated?: number | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "statistics_uploads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          category_id: string | null
          created_at: string
          feedback: string | null
          id: string
          phone_number: string | null
          rating: number
          respondent_name: string | null
          survey_type: string
          team_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          phone_number?: string | null
          rating: number
          respondent_name?: string | null
          survey_type?: string
          team_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          phone_number?: string | null
          rating?: number
          respondent_name?: string | null
          survey_type?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_managers: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          phone: string
          position: string | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          phone: string
          position?: string | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          phone?: string
          position?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_managers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_standings: {
        Row: {
          category_id: string
          created_at: string | null
          drawn: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          id: string
          lost: number | null
          played: number | null
          points: number | null
          team_id: string
          updated_at: string | null
          won: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          drawn?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          team_id: string
          updated_at?: string | null
          won?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          drawn?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          team_id?: string
          updated_at?: string | null
          won?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_standings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          academy_name: string | null
          country: string
          created_at: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          phone_country_code: string | null
          phone_number: string
          postal_code: string | null
          rejection_reason: string | null
          shield_url: string | null
          state: string
          status: string | null
          team_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academy_name?: string | null
          country?: string
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          phone_country_code?: string | null
          phone_number: string
          postal_code?: string | null
          rejection_reason?: string | null
          shield_url?: string | null
          state: string
          status?: string | null
          team_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academy_name?: string | null
          country?: string
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          phone_country_code?: string | null
          phone_number?: string
          postal_code?: string | null
          rejection_reason?: string | null
          shield_url?: string | null
          state?: string
          status?: string | null
          team_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tournament_config: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_clabe: string | null
          bank_name: string | null
          created_at: string
          early_bird_deadline: string | null
          early_bird_discount: number | null
          id: string
          max_players_per_team: number | null
          max_teams_per_category: number | null
          min_players_per_team: number | null
          payment_enabled: boolean | null
          payment_instructions: string | null
          payment_methods: Json | null
          registration_enabled: boolean | null
          registration_fee: number | null
          require_birth_certificate: boolean | null
          require_curp: boolean | null
          require_medical_certificate: boolean | null
          require_photo: boolean | null
          send_confirmation_email: boolean | null
          send_payment_reminder: boolean | null
          updated_at: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_clabe?: string | null
          bank_name?: string | null
          created_at?: string
          early_bird_deadline?: string | null
          early_bird_discount?: number | null
          id?: string
          max_players_per_team?: number | null
          max_teams_per_category?: number | null
          min_players_per_team?: number | null
          payment_enabled?: boolean | null
          payment_instructions?: string | null
          payment_methods?: Json | null
          registration_enabled?: boolean | null
          registration_fee?: number | null
          require_birth_certificate?: boolean | null
          require_curp?: boolean | null
          require_medical_certificate?: boolean | null
          require_photo?: boolean | null
          send_confirmation_email?: boolean | null
          send_payment_reminder?: boolean | null
          updated_at?: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_clabe?: string | null
          bank_name?: string | null
          created_at?: string
          early_bird_deadline?: string | null
          early_bird_discount?: number | null
          id?: string
          max_players_per_team?: number | null
          max_teams_per_category?: number | null
          min_players_per_team?: number | null
          payment_enabled?: boolean | null
          payment_instructions?: string | null
          payment_methods?: Json | null
          registration_enabled?: boolean | null
          registration_fee?: number | null
          require_birth_certificate?: boolean | null
          require_curp?: boolean | null
          require_medical_certificate?: boolean | null
          require_photo?: boolean | null
          send_confirmation_email?: boolean | null
          send_payment_reminder?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_check_digit: { Args: { id_base: string }; Returns: string }
      can_access_player: {
        Args: { _registration_id: string; _user_id: string }
        Returns: boolean
      }
      generate_payment_reference: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      update_team_standings: {
        Args: { p_category_id?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
