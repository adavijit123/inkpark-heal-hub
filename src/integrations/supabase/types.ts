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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aftercare_stages: {
        Row: {
          avoid: string | null
          cleaning: string | null
          contact: string | null
          day_from: number
          day_to: number | null
          id: string
          moisturizing: string | null
          normal: string | null
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          avoid?: string | null
          cleaning?: string | null
          contact?: string | null
          day_from: number
          day_to?: number | null
          id?: string
          moisturizing?: string | null
          normal?: string | null
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          avoid?: string | null
          cleaning?: string | null
          contact?: string | null
          day_from?: number
          day_to?: number | null
          id?: string
          moisturizing?: string | null
          normal?: string | null
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          id: string
          instagram: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          photo_sharing_consent: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_sharing_consent?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_sharing_consent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      healing_photos: {
        Row: {
          ai_feedback: string | null
          ai_status: string
          artist_feedback: string | null
          artist_feedback_at: string | null
          client_reaction: string | null
          concern: string | null
          created_at: string
          day_marker: number
          flagged: boolean
          id: string
          note: string | null
          storage_path: string
          tattoo_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_status?: string
          artist_feedback?: string | null
          artist_feedback_at?: string | null
          client_reaction?: string | null
          concern?: string | null
          created_at?: string
          day_marker: number
          flagged?: boolean
          id?: string
          note?: string | null
          storage_path: string
          tattoo_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_status?: string
          artist_feedback?: string | null
          artist_feedback_at?: string | null
          client_reaction?: string | null
          concern?: string | null
          created_at?: string
          day_marker?: number
          flagged?: boolean
          id?: string
          note?: string | null
          storage_path?: string
          tattoo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "healing_photos_tattoo_id_fkey"
            columns: ["tattoo_id"]
            isOneToOne: false
            referencedRelation: "tattoos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          channel: string
          day_marker: number
          enabled: boolean
          id: string
          scheduled_for: string
          sent_at: string | null
          tattoo_id: string
        }
        Insert: {
          channel?: string
          day_marker: number
          enabled?: boolean
          id?: string
          scheduled_for: string
          sent_at?: string | null
          tattoo_id: string
        }
        Update: {
          channel?: string
          day_marker?: number
          enabled?: boolean
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          tattoo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_tattoo_id_fkey"
            columns: ["tattoo_id"]
            isOneToOne: false
            referencedRelation: "tattoos"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_follows: {
        Row: {
          created_at: string
          id: string
          stage_id: string
          tattoo_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stage_id: string
          tattoo_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stage_id?: string
          tattoo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_follows_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "aftercare_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_follows_tattoo_id_fkey"
            columns: ["tattoo_id"]
            isOneToOne: false
            referencedRelation: "tattoos"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_settings: {
        Row: {
          booking_url: string | null
          contact_email: string | null
          id: boolean
          review_url: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          booking_url?: string | null
          contact_email?: string | null
          id?: boolean
          review_url?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          booking_url?: string | null
          contact_email?: string | null
          id?: boolean
          review_url?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          handled: boolean
          id: string
          message: string
          storage_path: string | null
          tattoo_id: string
        }
        Insert: {
          created_at?: string
          handled?: boolean
          id?: string
          message: string
          storage_path?: string | null
          tattoo_id: string
        }
        Update: {
          created_at?: string
          handled?: boolean
          id?: string
          message?: string
          storage_path?: string | null
          tattoo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_tattoo_id_fkey"
            columns: ["tattoo_id"]
            isOneToOne: false
            referencedRelation: "tattoos"
            referencedColumns: ["id"]
          },
        ]
      }
      tattoos: {
        Row: {
          access_token: string
          artist_id: string | null
          client_id: string
          created_at: string
          id: string
          photo_path: string | null
          placement: string | null
          rebooking_requested: boolean
          review_submitted: boolean
          style: string | null
          tattoo_date: string
          updated_at: string
        }
        Insert: {
          access_token?: string
          artist_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          photo_path?: string | null
          placement?: string | null
          rebooking_requested?: boolean
          review_submitted?: boolean
          style?: string | null
          tattoo_date?: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          artist_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          photo_path?: string | null
          placement?: string | null
          rebooking_requested?: boolean
          review_submitted?: boolean
          style?: string | null
          tattoo_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tattoos_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tattoos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "artist"
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
      app_role: ["admin", "artist"],
    },
  },
} as const
