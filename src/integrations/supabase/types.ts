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
      candidates: {
        Row: {
          id: string
          name: string
          email: string
          job_role: string
          status: string
          scores: Json | null
          summary: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          job_role: string
          status?: string
          scores?: Json | null
          summary?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          job_role?: string
          status?: string
          scores?: Json | null
          summary?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          id: string
          candidate_id: string
          mode: string
          start_time: string
          end_time: string | null
          transcript: Json
          analysis_json: Json | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          mode: string
          start_time?: string
          end_time?: string | null
          transcript?: Json
          analysis_json?: Json | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          mode?: string
          start_time?: string
          end_time?: string | null
          transcript?: Json
          analysis_json?: Json | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_questions: {
        Row: {
          id: string
          role: string
          question_text: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          role: string
          question_text: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          question_text?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          priority: string
          target_roles: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          priority?: string
          target_roles?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          priority?: string
          target_roles?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_resumes: {
        Row: {
          ai_cultural_fit_score: number | null
          ai_overall_score: number | null
          ai_red_flags: string[] | null
          ai_skill_match: Json | null
          ai_strengths: string[] | null
          ai_summary: string | null
          ai_weaknesses: string[] | null
          candidate_name: string
          created_at: string
          email: string
          id: string
          phone: string | null
          position_applied: string
          resume_text: string | null
          resume_url: string
          status: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          ai_cultural_fit_score?: number | null
          ai_overall_score?: number | null
          ai_red_flags?: string[] | null
          ai_skill_match?: Json | null
          ai_strengths?: string[] | null
          ai_summary?: string | null
          ai_weaknesses?: string[] | null
          candidate_name: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          position_applied: string
          resume_text?: string | null
          resume_url: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          ai_cultural_fit_score?: number | null
          ai_overall_score?: number | null
          ai_red_flags?: string[] | null
          ai_skill_match?: Json | null
          ai_strengths?: string[] | null
          ai_summary?: string | null
          ai_weaknesses?: string[] | null
          candidate_name?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          position_applied?: string
          resume_text?: string | null
          resume_url?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      employee_resumes: {
        Row: {
          ai_attrition_risk: string | null
          ai_career_path: Json | null
          ai_learning_roadmap: Json | null
          ai_promotion_probability: number | null
          ai_skill_gaps: string[] | null
          created_at: string
          employee_id: string
          id: string
          resume_text: string | null
          resume_url: string
          updated_at: string
        }
        Insert: {
          ai_attrition_risk?: string | null
          ai_career_path?: Json | null
          ai_learning_roadmap?: Json | null
          ai_promotion_probability?: number | null
          ai_skill_gaps?: string[] | null
          created_at?: string
          employee_id: string
          id?: string
          resume_text?: string | null
          resume_url: string
          updated_at?: string
        }
        Update: {
          ai_attrition_risk?: string | null
          ai_career_path?: Json | null
          ai_learning_roadmap?: Json | null
          ai_promotion_probability?: number | null
          ai_skill_gaps?: string[] | null
          created_at?: string
          employee_id?: string
          id?: string
          resume_text?: string | null
          resume_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_resumes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string
          email: string
          employee_id: string
          full_name: string
          id: string
          join_date: string
          phone: string | null
          position: string
          salary: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          employee_id: string
          full_name: string
          id?: string
          join_date: string
          phone?: string | null
          position: string
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          employee_id?: string
          full_name?: string
          id?: string
          join_date?: string
          phone?: string | null
          position?: string
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hr_collaboration_notes: {
        Row: {
          ai_summary: string | null
          author_id: string
          candidate_resume_id: string | null
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          author_id: string
          candidate_resume_id?: string | null
          content: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          author_id?: string
          candidate_resume_id?: string | null
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_collaboration_notes_candidate_resume_id_fkey"
            columns: ["candidate_resume_id"]
            isOneToOne: false
            referencedRelation: "candidate_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_job_recommendations: {
        Row: {
          ai_match_score: number | null
          ai_reasoning: string | null
          created_at: string
          employee_id: string
          id: string
          job_posting_id: string
        }
        Insert: {
          ai_match_score?: number | null
          ai_reasoning?: string | null
          created_at?: string
          employee_id: string
          id?: string
          job_posting_id: string
        }
        Update: {
          ai_match_score?: number | null
          ai_reasoning?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          job_posting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_job_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_job_recommendations_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          candidate_resume_id: string | null
          created_at: string
          generated_by: string | null
          id: string
          position: string
          questions: Json
        }
        Insert: {
          candidate_resume_id?: string | null
          created_at?: string
          generated_by?: string | null
          id?: string
          position: string
          questions: Json
        }
        Update: {
          candidate_resume_id?: string | null
          created_at?: string
          generated_by?: string | null
          id?: string
          position?: string
          questions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_candidate_resume_id_fkey"
            columns: ["candidate_resume_id"]
            isOneToOne: false
            referencedRelation: "candidate_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_email: string
          candidate_name: string
          created_at: string
          id: string
          interview_date: string
          interview_type: string
          interviewer_id: string | null
          job_posting_id: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          candidate_email: string
          candidate_name: string
          created_at?: string
          id?: string
          interview_date: string
          interview_type: string
          interviewer_id?: string | null
          job_posting_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_email?: string
          candidate_name?: string
          created_at?: string
          id?: string
          interview_date?: string
          interview_type?: string
          interviewer_id?: string | null
          job_posting_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          department: string
          description: string
          id: string
          job_type: string
          location: string | null
          posted_by: string | null
          requirements: string | null
          salary_range: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          description: string
          id?: string
          job_type: string
          location?: string | null
          posted_by?: string | null
          requirements?: string | null
          salary_range?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          description?: string
          id?: string
          job_type?: string
          location?: string | null
          posted_by?: string | null
          requirements?: string | null
          salary_range?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_recommendations: {
        Row: {
          ai_reasoning: string | null
          course_name: string
          course_url: string | null
          created_at: string
          employee_id: string
          estimated_hours: number | null
          id: string
          platform: string
          priority: string
          skill: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          course_name: string
          course_url?: string | null
          created_at?: string
          employee_id: string
          estimated_hours?: number | null
          id?: string
          platform: string
          priority?: string
          skill: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          course_name?: string
          course_url?: string | null
          created_at?: string
          employee_id?: string
          estimated_hours?: number | null
          id?: string
          platform?: string
          priority?: string
          skill?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          areas_for_improvement: string | null
          comments: string | null
          created_at: string
          employee_id: string
          goals: string | null
          id: string
          rating: number
          review_period: string
          reviewer_id: string | null
          strengths: string | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          employee_id: string
          goals?: string | null
          id?: string
          rating: number
          review_period: string
          reviewer_id?: string | null
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          employee_id?: string
          goals?: string | null
          id?: string
          rating?: number
          review_period?: string
          reviewer_id?: string | null
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recruitment_metrics: {
        Row: {
          ai_candidate_quality_avg: number | null
          ai_insights: string | null
          ai_predicted_time_to_hire: number | null
          created_at: string
          hired: number | null
          id: string
          interviewed: number | null
          screened: number | null
          total_applications: number | null
          week_start: string
        }
        Insert: {
          ai_candidate_quality_avg?: number | null
          ai_insights?: string | null
          ai_predicted_time_to_hire?: number | null
          created_at?: string
          hired?: number | null
          id?: string
          interviewed?: number | null
          screened?: number | null
          total_applications?: number | null
          week_start: string
        }
        Update: {
          ai_candidate_quality_avg?: number | null
          ai_insights?: string | null
          ai_predicted_time_to_hire?: number | null
          created_at?: string
          hired?: number | null
          id?: string
          interviewed?: number | null
          screened?: number | null
          total_applications?: number | null
          week_start?: string
        }
        Relationships: []
      }
      resume_screenings: {
        Row: {
          ai_analysis: string | null
          ai_score: number | null
          candidate_name: string
          created_at: string
          email: string
          id: string
          phone: string | null
          position_applied: string
          resume_url: string
          screened_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_score?: number | null
          candidate_name: string
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          position_applied: string
          resume_url: string
          screened_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_score?: number | null
          candidate_name?: string
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          position_applied?: string
          resume_url?: string
          screened_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sentiment_tracking: {
        Row: {
          ai_analysis: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          mood: string
          notes: string | null
          sentiment_score: number | null
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          mood: string
          notes?: string | null
          sentiment_score?: number | null
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          mood?: string
          notes?: string | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
    }
    Enums: {
      app_role: "admin" | "hr" | "employee" | "manager"
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
      app_role: ["admin", "hr", "employee", "manager"],
    },
  },
} as const
