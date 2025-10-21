export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      classroom_members: {
        Row: {
          classroom_id: string
          created_at: string
          id: string
          joined_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          id?: string
          joined_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'classroom_members_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'classroom_members_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      classrooms: {
        Row: {
          allow_new_students: boolean
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          allow_new_students?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          allow_new_students?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'classrooms_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      documents: {
        Row: {
          classroom_id: string
          created_at: string | null
          created_by: string
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          created_by: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          created_by?: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'documents_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
        ]
      }
      puzzle_attempts: {
        Row: {
          attempted_by: string
          created_at: string
          exp_earned: number | null
          grid: string[]
          id: string
          is_completed: boolean
          puzzle_id: string
          updated_at: string
        }
        Insert: {
          attempted_by: string
          created_at?: string
          exp_earned?: number | null
          grid: string[]
          id?: string
          is_completed?: boolean
          puzzle_id: string
          updated_at?: string
        }
        Update: {
          attempted_by?: string
          created_at?: string
          exp_earned?: number | null
          grid?: string[]
          id?: string
          is_completed?: boolean
          puzzle_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'puzzle_attempts_attempted_by_fkey'
            columns: ['attempted_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'puzzle_attempts_puzzle_id_fkey'
            columns: ['puzzle_id']
            isOneToOne: false
            referencedRelation: 'puzzles'
            referencedColumns: ['id']
          },
        ]
      }
      puzzles: {
        Row: {
          classroom_id: string
          created_at: string
          created_by: string
          exp: number
          grid: string[]
          id: string
          placed_words: string[]
          puzzle_type: string
          title: string
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          created_by: string
          exp: number
          grid?: string[]
          id?: string
          placed_words?: string[]
          puzzle_type: string
          title: string
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          created_by?: string
          exp?: number
          grid?: string[]
          id?: string
          placed_words?: string[]
          puzzle_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'puzzles_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'puzzles_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      question_attempts: {
        Row: {
          attempted_by: string
          category_id: string | null
          created_at: string
          id: string
          is_correct: boolean
          next_review_date: string | null
          question_elo_after: number | null
          question_elo_before: number | null
          question_id: string
          selected_answer: number | null
          student_elo_after: number | null
          student_elo_before: number | null
          updated_at: string | null
        }
        Insert: {
          attempted_by: string
          category_id?: string | null
          created_at?: string
          id?: string
          is_correct: boolean
          next_review_date?: string | null
          question_elo_after?: number | null
          question_elo_before?: number | null
          question_id: string
          selected_answer?: number | null
          student_elo_after?: number | null
          student_elo_before?: number | null
          updated_at?: string | null
        }
        Update: {
          attempted_by?: string
          category_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          next_review_date?: string | null
          question_elo_after?: number | null
          question_elo_before?: number | null
          question_id?: string
          selected_answer?: number | null
          student_elo_after?: number | null
          student_elo_before?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'question_attemps_attempted_by_fkey'
            columns: ['attempted_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_attemps_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_attempts_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'question_categories'
            referencedColumns: ['id']
          },
        ]
      }
      question_categories: {
        Row: {
          classroom_id: string
          created_at: string | null
          created_by: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'question_categories_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_categories_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      questions: {
        Row: {
          category_id: string | null
          classroom_id: string | null
          correct_answer: number
          created_at: string
          created_by: string
          elo: number
          explanation: string | null
          id: string
          image: string | null
          options: string[]
          question: string
          total_attempts: number
          total_corrects: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          classroom_id?: string | null
          correct_answer: number
          created_at?: string
          created_by: string
          elo?: number
          explanation?: string | null
          id?: string
          image?: string | null
          options: string[]
          question: string
          total_attempts?: number
          total_corrects?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          classroom_id?: string | null
          correct_answer?: number
          created_at?: string
          created_by?: string
          elo?: number
          explanation?: string | null
          id?: string
          image?: string | null
          options?: string[]
          question?: string
          total_attempts?: number
          total_corrects?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'questions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'question_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'questions_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'questions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      student_elo: {
        Row: {
          category_id: string | null
          classroom_id: string | null
          created_at: string
          elo_rating: number
          id: string
          total_attempts: number | null
          total_correct: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          classroom_id?: string | null
          created_at?: string
          elo_rating?: number
          id?: string
          total_attempts?: number | null
          total_correct?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          classroom_id?: string | null
          created_at?: string
          elo_rating?: number
          id?: string
          total_attempts?: number | null
          total_correct?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_elo_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'question_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_elo_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_elo_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      student_exp: {
        Row: {
          classroom_id: string | null
          created_at: string
          exp: number
          id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string
          exp?: number
          id?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          classroom_id?: string | null
          created_at?: string
          exp?: number
          id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_exp_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_exp_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          dob: string | null
          full_name: string
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          dob?: string | null
          full_name: string
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          dob?: string | null
          full_name?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          classroom_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          parent_id: string | null
          title: string
          type: string
          updated_at: string
          youtube_url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          parent_id?: string | null
          title: string
          type: string
          updated_at?: string
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          classroom_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          parent_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'videos_classroom_id_fkey'
            columns: ['classroom_id']
            isOneToOne: false
            referencedRelation: 'classrooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'videos_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'videos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'videos_uploaded_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_question: {
        Args: {
          p_category_id: string
          p_classroom_id: string
          p_elo_range?: number
          p_recent_question_ids?: string[]
          p_student_id: string
        }
        Returns: {
          correct_answer: number
          expected_success_rate: number
          explanation: string
          image: string
          options: string[]
          question_elo: number
          question_id: string
          question_text: string
          student_elo: number
        }[]
      }
      update_elos_atomic: {
        Args:
          | {
              p_category_id: string
              p_classroom_id: string
              p_is_correct: boolean
              p_question_id: string
              p_selected_answer?: number
              p_session_id: string
              p_student_id: string
              p_time_taken_seconds?: number
            }
          | {
              p_category_id: string
              p_classroom_id: string
              p_is_correct: boolean
              p_question_id: string
              p_selected_answer?: number
              p_student_id: string
            }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
