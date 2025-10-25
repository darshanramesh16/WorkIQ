export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      interview_results: {
        Row: {
          id: string
          name: string
          email?: string
          job_role: string
          status: string
          scores: Json
          summary?: string
          user_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string
          job_role: string
          status?: string
          scores: Json
          summary?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          job_role?: string
          status?: string
          scores?: Json
          summary?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}