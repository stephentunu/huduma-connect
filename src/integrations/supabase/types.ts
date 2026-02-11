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
      applicants: {
        Row: {
          application_id: string
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          email: string | null
          full_name: string
          id: string
          phone: string
          registered_by: string | null
          registration_date: string
          status: Database["public"]["Enums"]["applicant_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          email?: string | null
          full_name: string
          id?: string
          phone: string
          registered_by?: string | null
          registration_date?: string
          status?: Database["public"]["Enums"]["applicant_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          registered_by?: string | null
          registration_date?: string
          status?: Database["public"]["Enums"]["applicant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicants_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_queue: {
        Row: {
          average_service_time_minutes: number
          centre_id: string
          created_at: string
          current_queue_number: number
          id: string
          queue_date: string
          updated_at: string
        }
        Insert: {
          average_service_time_minutes?: number
          centre_id: string
          created_at?: string
          current_queue_number?: number
          id?: string
          queue_date?: string
          updated_at?: string
        }
        Update: {
          average_service_time_minutes?: number
          centre_id?: string
          created_at?: string
          current_queue_number?: number
          id?: string
          queue_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_queue_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "huduma_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          approved_at: string | null
          approved_by: string | null
          centre_id: string
          citizen_id: string
          created_at: string
          estimated_wait_minutes: number | null
          id: string
          notes: string | null
          queue_number: number | null
          rescheduled_date: string | null
          rescheduled_time: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          staff_notes: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          approved_at?: string | null
          approved_by?: string | null
          centre_id: string
          citizen_id: string
          created_at?: string
          estimated_wait_minutes?: number | null
          id?: string
          notes?: string | null
          queue_number?: number | null
          rescheduled_date?: string | null
          rescheduled_time?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          approved_at?: string | null
          approved_by?: string | null
          centre_id?: string
          citizen_id?: string
          created_at?: string
          estimated_wait_minutes?: number | null
          id?: string
          notes?: string | null
          queue_number?: number | null
          rescheduled_date?: string | null
          rescheduled_time?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_centre_id_fkey"
            columns: ["centre_id"]
            isOneToOne: false
            referencedRelation: "huduma_centres"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          applicant_id: string
          created_at: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string
          document_number: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "national_ids_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "national_ids_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      huduma_centres: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location: string
          max_daily_appointments: number
          name: string
          operating_hours_end: string
          operating_hours_start: string
          slot_duration_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location: string
          max_daily_appointments?: number
          name: string
          operating_hours_end?: string
          operating_hours_start?: string
          slot_duration_minutes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string
          max_daily_appointments?: number
          name?: string
          operating_hours_end?: string
          operating_hours_start?: string
          slot_duration_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      in_app_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          applicant_id: string
          attempts: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          provider_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          attempts?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          attempts?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          center_name: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          center_name: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          center_name?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_wait_time: {
        Args: { p_centre_id: string; p_queue_number: number }
        Returns: number
      }
      get_next_queue_number: {
        Args: { p_centre_id: string; p_date: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "staff" | "admin" | "citizen"
      applicant_status: "registered" | "processing" | "ready" | "collected"
      appointment_status:
        | "pending"
        | "approved"
        | "rescheduled"
        | "cancelled"
        | "completed"
        | "no_show"
      document_type:
        | "national_id"
        | "passport"
        | "visa"
        | "birth_certificate"
        | "driving_license"
        | "good_conduct_certificate"
        | "marriage_certificate"
        | "death_certificate"
      notification_channel: "sms" | "email"
      notification_status: "pending" | "sent" | "delivered" | "failed"
      service_type: "id_application" | "id_replacement" | "id_collection"
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
      app_role: ["staff", "admin", "citizen"],
      applicant_status: ["registered", "processing", "ready", "collected"],
      appointment_status: [
        "pending",
        "approved",
        "rescheduled",
        "cancelled",
        "completed",
        "no_show",
      ],
      document_type: [
        "national_id",
        "passport",
        "visa",
        "birth_certificate",
        "driving_license",
        "good_conduct_certificate",
        "marriage_certificate",
        "death_certificate",
      ],
      notification_channel: ["sms", "email"],
      notification_status: ["pending", "sent", "delivered", "failed"],
      service_type: ["id_application", "id_replacement", "id_collection"],
    },
  },
} as const
