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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      boosts: {
        Row: {
          amount: number
          build_request_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          build_request_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          build_request_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosts_build_request_id_fkey"
            columns: ["build_request_id"]
            isOneToOne: false
            referencedRelation: "build_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      build_requests: {
        Row: {
          boost_amount: number | null
          budget_notes: string | null
          category: string
          competition_id: string | null
          created_at: string | null
          design_preferences: string | null
          detailed_description: string
          examples_inspiration: string | null
          features: Json | null
          generation_status: string | null
          gif_url: string | null
          github_url: string | null
          id: string
          preview_url: string | null
          short_description: string
          status: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
          user_id: string
          vote_count: number | null
        }
        Insert: {
          boost_amount?: number | null
          budget_notes?: string | null
          category: string
          competition_id?: string | null
          created_at?: string | null
          design_preferences?: string | null
          detailed_description: string
          examples_inspiration?: string | null
          features?: Json | null
          generation_status?: string | null
          gif_url?: string | null
          github_url?: string | null
          id?: string
          preview_url?: string | null
          short_description: string
          status?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          vote_count?: number | null
        }
        Update: {
          boost_amount?: number | null
          budget_notes?: string | null
          category?: string
          competition_id?: string | null
          created_at?: string | null
          design_preferences?: string | null
          detailed_description?: string
          examples_inspiration?: string | null
          features?: Json | null
          generation_status?: string | null
          gif_url?: string | null
          github_url?: string | null
          id?: string
          preview_url?: string | null
          short_description?: string
          status?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "build_requests_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "build_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_entries: {
        Row: {
          campaign_id: string
          created_at: string | null
          description: string
          estimated_cost: number | null
          estimated_timeline: string | null
          id: string
          proposal: string
          title: string
          user_id: string
          vote_count: number | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          description: string
          estimated_cost?: number | null
          estimated_timeline?: string | null
          id?: string
          proposal: string
          title: string
          user_id: string
          vote_count?: number | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          description?: string
          estimated_cost?: number | null
          estimated_timeline?: string | null
          id?: string
          proposal?: string
          title?: string
          user_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_votes: {
        Row: {
          campaign_entry_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          campaign_entry_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          campaign_entry_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_votes_campaign_entry_id_fkey"
            columns: ["campaign_entry_id"]
            isOneToOne: false
            referencedRelation: "campaign_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string | null
          contract_terms: string | null
          created_at: string | null
          creator_id: string
          deadline: string
          description: string
          entry_fee: number | null
          id: string
          is_featured: boolean | null
          max_entries: number | null
          prize_pool: number | null
          status: string
          title: string
          updated_at: string | null
          voting_ends_at: string
          winner_id: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          contract_terms?: string | null
          created_at?: string | null
          creator_id: string
          deadline: string
          description: string
          entry_fee?: number | null
          id?: string
          is_featured?: boolean | null
          max_entries?: number | null
          prize_pool?: number | null
          status?: string
          title: string
          updated_at?: string | null
          voting_ends_at: string
          winner_id?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string | null
          contract_terms?: string | null
          created_at?: string | null
          creator_id?: string
          deadline?: string
          description?: string
          entry_fee?: number | null
          id?: string
          is_featured?: boolean | null
          max_entries?: number | null
          prize_pool?: number | null
          status?: string
          title?: string
          updated_at?: string | null
          voting_ends_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          build_request_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          build_request_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          build_request_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_build_request_id_fkey"
            columns: ["build_request_id"]
            isOneToOne: false
            referencedRelation: "build_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          category: string
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          status: string | null
          title: string
          voting_deadline: string
          winner_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string | null
          title: string
          voting_deadline: string
          winner_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string | null
          title?: string
          voting_deadline?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_projects: {
        Row: {
          build_request_id: string | null
          code_files: Json | null
          created_at: string | null
          error_message: string | null
          generated_at: string | null
          github_url: string | null
          id: string
          market_research: string | null
          prd: string | null
          preview_url: string | null
          project_charter: string | null
          project_slug: string
          status: string | null
          tech_spec: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          build_request_id?: string | null
          code_files?: Json | null
          created_at?: string | null
          error_message?: string | null
          generated_at?: string | null
          github_url?: string | null
          id?: string
          market_research?: string | null
          prd?: string | null
          preview_url?: string | null
          project_charter?: string | null
          project_slug: string
          status?: string | null
          tech_spec?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          build_request_id?: string | null
          code_files?: Json | null
          created_at?: string | null
          error_message?: string | null
          generated_at?: string | null
          github_url?: string | null
          id?: string
          market_research?: string | null
          prd?: string | null
          preview_url?: string | null
          project_charter?: string | null
          project_slug?: string
          status?: string | null
          tech_spec?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_projects_build_request_id_fkey"
            columns: ["build_request_id"]
            isOneToOne: false
            referencedRelation: "build_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          bonus_votes: number | null
          builder_verified_at: string | null
          created_at: string | null
          display_name: string | null
          extra_submissions: number | null
          github_access_token: string | null
          github_username: string | null
          github_connected_at: string | null
          id: string
          is_builder: boolean | null
          is_verified: boolean | null
          referral_code: string | null
          referred_by: string | null
          reputation_score: number | null
          total_votes_received: number | null
          updated_at: string | null
          username: string
          weekly_submissions_reset_at: string | null
          weekly_submissions_used: number | null
          wins_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          bonus_votes?: number | null
          builder_verified_at?: string | null
          created_at?: string | null
          display_name?: string | null
          extra_submissions?: number | null
          github_access_token?: string | null
          github_username?: string | null
          github_connected_at?: string | null
          id: string
          is_builder?: boolean | null
          is_verified?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          reputation_score?: number | null
          total_votes_received?: number | null
          updated_at?: string | null
          username: string
          weekly_submissions_reset_at?: string | null
          weekly_submissions_used?: number | null
          wins_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          bonus_votes?: number | null
          builder_verified_at?: string | null
          created_at?: string | null
          display_name?: string | null
          extra_submissions?: number | null
          github_access_token?: string | null
          github_username?: string | null
          github_connected_at?: string | null
          id?: string
          is_builder?: boolean | null
          is_verified?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          reputation_score?: number | null
          total_votes_received?: number | null
          updated_at?: string | null
          username?: string
          weekly_submissions_reset_at?: string | null
          weekly_submissions_used?: number | null
          wins_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_payment_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          build_request_id: string
          competition_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          build_request_id: string
          competition_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          build_request_id?: string
          competition_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_build_request_id_fkey"
            columns: ["build_request_id"]
            isOneToOne: false
            referencedRelation: "build_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
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
      process_referral: {
        Args: { p_referral_code: string; p_referred_id: string }
        Returns: boolean
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

// Custom type aliases for convenience
export type Profile = Database['public']['Tables']['profiles']['Row']
export type BuildRequest = Database['public']['Tables']['build_requests']['Row']
export type Competition = Database['public']['Tables']['competitions']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignEntry = Database['public']['Tables']['campaign_entries']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type GeneratedProject = Database['public']['Tables']['generated_projects']['Row']

// Types with relationships
export type BuildRequestWithProfile = BuildRequest & {
  profiles: Profile | null
}

export type CommentWithProfile = Comment & {
  profiles: Profile | null
}

export type CampaignWithProfile = Campaign & {
  profiles: Profile | null
}
