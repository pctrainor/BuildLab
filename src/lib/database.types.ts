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
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
          total_votes_received: number
          wins_count: number
          reputation_score: number
          is_verified: boolean
          weekly_submissions_used: number
          weekly_submissions_reset_at: string
          extra_submissions: number
          is_builder: boolean
          builder_verified_at: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          total_votes_received?: number
          wins_count?: number
          reputation_score?: number
          is_verified?: boolean
          weekly_submissions_used?: number
          weekly_submissions_reset_at?: string
          extra_submissions?: number
          is_builder?: boolean
          builder_verified_at?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
          total_votes_received?: number
          wins_count?: number
          reputation_score?: number
          is_verified?: boolean
          weekly_submissions_used?: number
          weekly_submissions_reset_at?: string
          extra_submissions?: number
          is_builder?: boolean
          builder_verified_at?: string | null
          stripe_customer_id?: string | null
        }
      }
      campaigns: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string
          category: string | null
          budget_min: number | null
          budget_max: number | null
          deadline: string
          voting_ends_at: string
          status: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled'
          winner_id: string | null
          contract_terms: string | null
          is_featured: boolean
          entry_fee: number
          prize_pool: number
          max_entries: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description: string
          category?: string | null
          budget_min?: number | null
          budget_max?: number | null
          deadline: string
          voting_ends_at: string
          status?: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled'
          winner_id?: string | null
          contract_terms?: string | null
          is_featured?: boolean
          entry_fee?: number
          prize_pool?: number
          max_entries?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string
          category?: string | null
          budget_min?: number | null
          budget_max?: number | null
          deadline?: string
          voting_ends_at?: string
          status?: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled'
          winner_id?: string | null
          contract_terms?: string | null
          is_featured?: boolean
          entry_fee?: number
          prize_pool?: number
          max_entries?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      campaign_entries: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          title: string
          description: string
          proposal: string
          estimated_cost: number | null
          estimated_timeline: string | null
          vote_count: number
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          title: string
          description: string
          proposal: string
          estimated_cost?: number | null
          estimated_timeline?: string | null
          vote_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          title?: string
          description?: string
          proposal?: string
          estimated_cost?: number | null
          estimated_timeline?: string | null
          vote_count?: number
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'submission_pack' | 'campaign_creation' | 'boost' | 'entry_fee' | 'prize_payout' | 'platform_fee'
          amount: number
          stripe_payment_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'submission_pack' | 'campaign_creation' | 'boost' | 'entry_fee' | 'prize_payout' | 'platform_fee'
          amount: number
          stripe_payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'submission_pack' | 'campaign_creation' | 'boost' | 'entry_fee' | 'prize_payout' | 'platform_fee'
          amount?: number
          stripe_payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata?: Json
          created_at?: string
        }
      }
      build_requests: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string
          short_description: string
          detailed_description: string
          target_audience: string | null
          features: Json
          design_preferences: string | null
          examples_inspiration: string | null
          budget_notes: string | null
          gif_url: string | null
          status: 'draft' | 'submitted' | 'in_competition' | 'winner' | 'in_progress' | 'completed'
          competition_id: string | null
          vote_count: number
          boost_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category: string
          short_description: string
          detailed_description: string
          target_audience?: string | null
          features?: Json
          design_preferences?: string | null
          examples_inspiration?: string | null
          budget_notes?: string | null
          gif_url?: string | null
          status?: 'draft' | 'submitted' | 'in_competition' | 'winner' | 'in_progress' | 'completed'
          competition_id?: string | null
          vote_count?: number
          boost_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: string
          short_description?: string
          detailed_description?: string
          target_audience?: string | null
          features?: Json
          design_preferences?: string | null
          examples_inspiration?: string | null
          budget_notes?: string | null
          gif_url?: string | null
          status?: 'draft' | 'submitted' | 'in_competition' | 'winner' | 'in_progress' | 'completed'
          competition_id?: string | null
          vote_count?: number
          boost_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      competitions: {
        Row: {
          id: string
          title: string
          category: string
          start_date: string
          end_date: string
          voting_deadline: string
          status: 'upcoming' | 'active' | 'voting' | 'completed'
          winner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          category: string
          start_date: string
          end_date: string
          voting_deadline: string
          status?: 'upcoming' | 'active' | 'voting' | 'completed'
          winner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: string
          start_date?: string
          end_date?: string
          voting_deadline?: string
          status?: 'upcoming' | 'active' | 'voting' | 'completed'
          winner_id?: string | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          build_request_id: string
          competition_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          build_request_id: string
          competition_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          build_request_id?: string
          competition_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          build_request_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          build_request_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          build_request_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      boosts: {
        Row: {
          id: string
          user_id: string
          build_request_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          build_request_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          build_request_id?: string
          amount?: number
          created_at?: string
        }
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
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type BuildRequest = Database['public']['Tables']['build_requests']['Row']
export type Competition = Database['public']['Tables']['competitions']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Boost = Database['public']['Tables']['boosts']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type CampaignEntry = Database['public']['Tables']['campaign_entries']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']

// Extended types with joins
export type BuildRequestWithProfile = BuildRequest & {
  profiles: Profile
}

export type CommentWithProfile = Comment & {
  profiles: Profile
}

export type CampaignWithProfile = Campaign & {
  profiles: Profile
}

export type CampaignEntryWithProfile = CampaignEntry & {
  profiles: Profile
}
