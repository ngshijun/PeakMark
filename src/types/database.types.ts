export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          description: string
          exp_reward: number
          icon: string
          id: string
          name: string
          rarity: string
          unlock_criteria: Json
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          description: string
          exp_reward?: number
          icon: string
          id?: string
          name: string
          rarity: string
          unlock_criteria?: Json
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          description?: string
          exp_reward?: number
          icon?: string
          id?: string
          name?: string
          rarity?: string
          unlock_criteria?: Json
        }
        Relationships: []
      }
      avatars: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          name: string
          rarity: string
          unlock_achievement_id: string | null
          unlock_level: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          name: string
          rarity: string
          unlock_achievement_id?: string | null
          unlock_level?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          name?: string
          rarity?: string
          unlock_achievement_id?: string | null
          unlock_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'avatars_unlock_achievement_id_fkey'
            columns: ['unlock_achievement_id']
            isOneToOne: false
            referencedRelation: 'achievements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'avatars_unlock_level_fkey'
            columns: ['unlock_level']
            isOneToOne: false
            referencedRelation: 'levels'
            referencedColumns: ['level']
          },
        ]
      }
      exp_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'exp_transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      levels: {
        Row: {
          created_at: string | null
          exp_required: number
          level: number
          rewards: Json | null
          title: string
          unlock_features: Json | null
        }
        Insert: {
          created_at?: string | null
          exp_required: number
          level: number
          rewards?: Json | null
          title: string
          unlock_features?: Json | null
        }
        Update: {
          created_at?: string | null
          exp_required?: number
          level?: number
          rewards?: Json | null
          title?: string
          unlock_features?: Json | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          payment_method: string | null
          status: string
          stripe_payment_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_method?: string | null
          status: string
          stripe_payment_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_method?: string | null
          status?: string
          stripe_payment_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_subscription_id_fkey'
            columns: ['subscription_id']
            isOneToOne: false
            referencedRelation: 'subscriptions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      question_attempts: {
        Row: {
          answer: number | null
          created_at: string | null
          exp_earned: number | null
          id: string
          is_correct: boolean
          question_id: string
          question_set_id: string | null
          skill_rating_after: number | null
          skill_rating_before: number | null
          time_taken: number
          user_id: string
        }
        Insert: {
          answer?: number | null
          created_at?: string | null
          exp_earned?: number | null
          id?: string
          is_correct?: boolean
          question_id: string
          question_set_id?: string | null
          skill_rating_after?: number | null
          skill_rating_before?: number | null
          time_taken?: number
          user_id: string
        }
        Update: {
          answer?: number | null
          created_at?: string | null
          exp_earned?: number | null
          id?: string
          is_correct?: boolean
          question_id?: string
          question_set_id?: string | null
          skill_rating_after?: number | null
          skill_rating_before?: number | null
          time_taken?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'question_attempts_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_attempts_question_set_id_fkey'
            columns: ['question_set_id']
            isOneToOne: false
            referencedRelation: 'question_sets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_attempts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      question_set_questions: {
        Row: {
          created_at: string | null
          order_index: number
          question_id: string
          question_set_id: string
        }
        Insert: {
          created_at?: string | null
          order_index?: number
          question_id: string
          question_set_id: string
        }
        Update: {
          created_at?: string | null
          order_index?: number
          question_id?: string
          question_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'question_set_questions_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_set_questions_question_set_id_fkey'
            columns: ['question_set_id']
            isOneToOne: false
            referencedRelation: 'question_sets'
            referencedColumns: ['id']
          },
        ]
      }
      question_sets: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string
          description: string | null
          difficulty_range_max: number | null
          difficulty_range_min: number | null
          id: string
          max_attempts: number | null
          subject_id: string
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by: string
          description?: string | null
          difficulty_range_max?: number | null
          difficulty_range_min?: number | null
          id?: string
          max_attempts?: number | null
          subject_id: string
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          difficulty_range_max?: number | null
          difficulty_range_min?: number | null
          id?: string
          max_attempts?: number | null
          subject_id?: string
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'question_sets_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_sets_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      questions: {
        Row: {
          active: boolean | null
          content: string
          correct_answer: number
          created_at: string | null
          created_by: string
          difficulty: number | null
          explanation: string | null
          id: string
          options: Json
          subject_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          active?: boolean | null
          content: string
          correct_answer: number
          created_at?: string | null
          created_by: string
          difficulty?: number | null
          explanation?: string | null
          id?: string
          options: Json
          subject_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          active?: boolean | null
          content?: string
          correct_answer?: number
          created_at?: string | null
          created_by?: string
          difficulty?: number | null
          explanation?: string | null
          id?: string
          options?: Json
          subject_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'questions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'questions_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      student_achievements: {
        Row: {
          achievement_id: string
          completed: boolean | null
          created_at: string | null
          notified: boolean | null
          progress: Json | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          completed?: boolean | null
          created_at?: string | null
          notified?: boolean | null
          progress?: Json | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          completed?: boolean | null
          created_at?: string | null
          notified?: boolean | null
          progress?: Json | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_achievements_achievement_id_fkey'
            columns: ['achievement_id']
            isOneToOne: false
            referencedRelation: 'achievements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_achievements_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      student_profiles: {
        Row: {
          avatar_id: string | null
          best_streak: number | null
          created_at: string | null
          current_level: number | null
          last_activity: string | null
          streak_days: number | null
          title_id: string | null
          total_exp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_id?: string | null
          best_streak?: number | null
          created_at?: string | null
          current_level?: number | null
          last_activity?: string | null
          streak_days?: number | null
          title_id?: string | null
          total_exp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string | null
          best_streak?: number | null
          created_at?: string | null
          current_level?: number | null
          last_activity?: string | null
          streak_days?: number | null
          title_id?: string | null
          total_exp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_profiles_avatar_id_fkey'
            columns: ['avatar_id']
            isOneToOne: false
            referencedRelation: 'avatars'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_profiles_title_id_fkey'
            columns: ['title_id']
            isOneToOne: false
            referencedRelation: 'titles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      student_progress: {
        Row: {
          accuracy_rate: number | null
          correct_answers: number | null
          last_activity: string | null
          questions_answered: number | null
          skill_rating: number | null
          subject_id: string
          total_time_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          correct_answers?: number | null
          last_activity?: string | null
          questions_answered?: number | null
          skill_rating?: number | null
          subject_id: string
          total_time_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy_rate?: number | null
          correct_answers?: number | null
          last_activity?: string | null
          questions_answered?: number | null
          skill_rating?: number | null
          subject_id?: string
          total_time_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_progress_subject_id_fkey'
            columns: ['subject_id']
            isOneToOne: false
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      student_question_set_progress: {
        Row: {
          attempt_number: number
          completed_at: string | null
          completed_questions: number | null
          correct_answers: number | null
          question_set_id: string
          score: number | null
          started_at: string | null
          time_spent: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          completed_questions?: number | null
          correct_answers?: number | null
          question_set_id: string
          score?: number | null
          started_at?: string | null
          time_spent?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          completed_questions?: number | null
          correct_answers?: number | null
          question_set_id?: string
          score?: number | null
          started_at?: string | null
          time_spent?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_question_set_progress_question_set_id_fkey'
            columns: ['question_set_id']
            isOneToOne: false
            referencedRelation: 'question_sets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_question_set_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      subjects: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          billing_interval: string
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json
          id: string
          limits: Json
          name: string
          price: number
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          billing_interval: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json
          id?: string
          limits?: Json
          name: string
          price: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          billing_interval?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json
          id?: string
          limits?: Json
          name?: string
          price?: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'subscription_plans'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      titles: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          rarity: string
          unlock_achievement_id: string | null
          unlock_level: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          rarity: string
          unlock_achievement_id?: string | null
          unlock_level?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          rarity?: string
          unlock_achievement_id?: string | null
          unlock_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'titles_unlock_achievement_id_fkey'
            columns: ['unlock_achievement_id']
            isOneToOne: false
            referencedRelation: 'achievements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'titles_unlock_level_fkey'
            columns: ['unlock_level']
            isOneToOne: false
            referencedRelation: 'levels'
            referencedColumns: ['level']
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: {
        Args: {
          user_email: string
          user_id: string
          user_name: string
          user_role: string
        }
        Returns: undefined
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
