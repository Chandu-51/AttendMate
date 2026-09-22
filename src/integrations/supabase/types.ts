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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance_goals: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          note: string
          priority: string
          subject_id: string | null
          target_percentage: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          note?: string
          priority?: string
          subject_id?: string | null
          target_percentage?: number
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          note?: string
          priority?: string
          subject_id?: string | null
          target_percentage?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_goals_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          class_number: number
          created_at: string
          date: string
          id: string
          notes: string
          status: string
          subject_id: string
          user_id: string
        }
        Insert: {
          class_number?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string
          status?: string
          subject_id: string
          user_id: string
        }
        Update: {
          class_number?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string
          status?: string
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          college: string
          created_at: string
          email: string
          full_name: string
          id: string
          min_attendance: number
          onboarded: boolean
          section: string
          semester: string
          semester_end: string | null
          semester_start: string | null
          target_attendance: number
          updated_at: string
        }
        Insert: {
          college?: string
          created_at?: string
          email?: string
          full_name?: string
          id: string
          min_attendance?: number
          onboarded?: boolean
          section?: string
          semester?: string
          semester_end?: string | null
          semester_start?: string | null
          target_attendance?: number
          updated_at?: string
        }
        Update: {
          college?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          min_attendance?: number
          onboarded?: boolean
          section?: string
          semester?: string
          semester_end?: string | null
          semester_start?: string | null
          target_attendance?: number
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          color: string
          created_at: string
          faculty: string
          id: string
          name: string
          target_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: string
          color?: string
          created_at?: string
          faculty?: string
          id?: string
          name: string
          target_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          faculty?: string
          id?: string
          name?: string
          target_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timetable_entries: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          faculty: string
          id: string
          room: string
          start_time: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          faculty?: string
          id?: string
          room?: string
          start_time: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          faculty?: string
          id?: string
          room?: string
          start_time?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
