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
      best_xi: {
        Row: {
          created_at: string
          editorial_note: string | null
          formation: string
          id: string
          is_published: boolean
          players: Json
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          editorial_note?: string | null
          formation: string
          id?: string
          is_published?: boolean
          players: Json
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          editorial_note?: string | null
          formation?: string
          id?: string
          is_published?: boolean
          players?: Json
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmation_token: string
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          source: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          age: number | null
          agent: string | null
          caps_rdc: number | null
          contract_expires: string | null
          country_of_birth: string | null
          created_at: string
          current_club: string | null
          current_club_id: string | null
          date_of_birth: string | null
          eligibility_note: string | null
          eligibility_status: string | null
          foot: string | null
          height_cm: number | null
          id: number
          image_url: string | null
          is_binational: boolean | null
          market_value_eur: number | null
          name: string
          nationalities: Json | null
          on_loan_from: string | null
          other_nationalities: Json | null
          place_of_birth: string | null
          player_category: string | null
          position: string | null
          season_assists: number | null
          season_games: number | null
          season_goals: number | null
          season_minutes: number | null
          season_rating: number | null
          slug: string
          source_urls: string[] | null
          tier: string | null
          transfermarkt_id: string | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          age?: number | null
          agent?: string | null
          caps_rdc?: number | null
          contract_expires?: string | null
          country_of_birth?: string | null
          created_at?: string
          current_club?: string | null
          current_club_id?: string | null
          date_of_birth?: string | null
          eligibility_note?: string | null
          eligibility_status?: string | null
          foot?: string | null
          height_cm?: number | null
          id?: number
          image_url?: string | null
          is_binational?: boolean | null
          market_value_eur?: number | null
          name: string
          nationalities?: Json | null
          on_loan_from?: string | null
          other_nationalities?: Json | null
          place_of_birth?: string | null
          player_category?: string | null
          position?: string | null
          season_assists?: number | null
          season_games?: number | null
          season_goals?: number | null
          season_minutes?: number | null
          season_rating?: number | null
          slug: string
          source_urls?: string[] | null
          tier?: string | null
          transfermarkt_id?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          age?: number | null
          agent?: string | null
          caps_rdc?: number | null
          contract_expires?: string | null
          country_of_birth?: string | null
          created_at?: string
          current_club?: string | null
          current_club_id?: string | null
          date_of_birth?: string | null
          eligibility_note?: string | null
          eligibility_status?: string | null
          foot?: string | null
          height_cm?: number | null
          id?: number
          image_url?: string | null
          is_binational?: boolean | null
          market_value_eur?: number | null
          name?: string
          nationalities?: Json | null
          on_loan_from?: string | null
          other_nationalities?: Json | null
          place_of_birth?: string | null
          player_category?: string | null
          position?: string | null
          season_assists?: number | null
          season_games?: number | null
          season_goals?: number | null
          season_minutes?: number | null
          season_rating?: number | null
          slug?: string
          source_urls?: string[] | null
          tier?: string | null
          transfermarkt_id?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      staging_players_import: {
        Row: {
          age: number | null
          agent: string | null
          caps_rdc: number | null
          contract_expires: string | null
          country_of_birth: string | null
          current_club: string | null
          current_club_id: string | null
          date_of_birth: string | null
          eligibility_note: string | null
          eligibility_status: string | null
          foot: string | null
          height_cm: number | null
          image_url: string | null
          is_binational: boolean | null
          market_value_eur: number | null
          name: string | null
          nationalities: Json | null
          on_loan_from: string | null
          other_nationalities: Json | null
          place_of_birth: string | null
          player_category: string | null
          position: string | null
          season_assists: number | null
          season_games: number | null
          season_goals: number | null
          season_minutes: number | null
          season_rating: number | null
          slug: string
          tier: string | null
          transfermarkt_id: string | null
          verified: boolean | null
        }
        Insert: {
          age?: number | null
          agent?: string | null
          caps_rdc?: number | null
          contract_expires?: string | null
          country_of_birth?: string | null
          current_club?: string | null
          current_club_id?: string | null
          date_of_birth?: string | null
          eligibility_note?: string | null
          eligibility_status?: string | null
          foot?: string | null
          height_cm?: number | null
          image_url?: string | null
          is_binational?: boolean | null
          market_value_eur?: number | null
          name?: string | null
          nationalities?: Json | null
          on_loan_from?: string | null
          other_nationalities?: Json | null
          place_of_birth?: string | null
          player_category?: string | null
          position?: string | null
          season_assists?: number | null
          season_games?: number | null
          season_goals?: number | null
          season_minutes?: number | null
          season_rating?: number | null
          slug: string
          tier?: string | null
          transfermarkt_id?: string | null
          verified?: boolean | null
        }
        Update: {
          age?: number | null
          agent?: string | null
          caps_rdc?: number | null
          contract_expires?: string | null
          country_of_birth?: string | null
          current_club?: string | null
          current_club_id?: string | null
          date_of_birth?: string | null
          eligibility_note?: string | null
          eligibility_status?: string | null
          foot?: string | null
          height_cm?: number | null
          image_url?: string | null
          is_binational?: boolean | null
          market_value_eur?: number | null
          name?: string | null
          nationalities?: Json | null
          on_loan_from?: string | null
          other_nationalities?: Json | null
          place_of_birth?: string | null
          player_category?: string | null
          position?: string | null
          season_assists?: number | null
          season_games?: number | null
          season_goals?: number | null
          season_minutes?: number | null
          season_rating?: number | null
          slug?: string
          tier?: string | null
          transfermarkt_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      user_lists: {
        Row: {
          avg_age: number | null
          bench: Json
          captain_id: number | null
          created_at: string
          email: string | null
          formation: string
          id: string
          is_submitted: boolean
          locale: string | null
          platforms_shared: string[]
          radar_count: number
          referrer: string | null
          roster_count: number
          session_id: string
          shared_count: number
          starting_xi: Json
          total_market_value_eur: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          avg_age?: number | null
          bench: Json
          captain_id?: number | null
          created_at?: string
          email?: string | null
          formation: string
          id?: string
          is_submitted?: boolean
          locale?: string | null
          platforms_shared?: string[]
          radar_count?: number
          referrer?: string | null
          roster_count?: number
          session_id: string
          shared_count?: number
          starting_xi: Json
          total_market_value_eur?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          avg_age?: number | null
          bench?: Json
          captain_id?: number | null
          created_at?: string
          email?: string | null
          formation?: string
          id?: string
          is_submitted?: boolean
          locale?: string | null
          platforms_shared?: string[]
          radar_count?: number
          referrer?: string | null
          roster_count?: number
          session_id?: string
          shared_count?: number
          starting_xi?: Json
          total_market_value_eur?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lists_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lists_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "v_players_tier1"
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
      v_home_stats: {
        Row: {
          avg_age: number | null
          total_clubs: number | null
          total_countries: number | null
          total_heritage: number | null
          total_market_value: number | null
          total_players: number | null
          total_radar: number | null
          total_roster: number | null
        }
        Relationships: []
      }
      v_players_tier1: {
        Row: {
          age: number | null
          agent: string | null
          caps_rdc: number | null
          contract_expires: string | null
          country_of_birth: string | null
          created_at: string | null
          current_club: string | null
          current_club_id: string | null
          date_of_birth: string | null
          eligibility_note: string | null
          eligibility_status: string | null
          foot: string | null
          height_cm: number | null
          id: number | null
          image_url: string | null
          is_binational: boolean | null
          market_value_eur: number | null
          name: string | null
          nationalities: Json | null
          on_loan_from: string | null
          other_nationalities: Json | null
          place_of_birth: string | null
          player_category: string | null
          position: string | null
          season_assists: number | null
          season_games: number | null
          season_goals: number | null
          season_minutes: number | null
          season_rating: number | null
          slug: string | null
          source_urls: string[] | null
          tier: string | null
          transfermarkt_id: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          age?: number | null
          agent?: string | null
          caps_rdc?: number | null
          contract_expires?: string | null
          country_of_birth?: string | null
          created_at?: string | null
          current_club?: string | null
          current_club_id?: string | null
          date_of_birth?: string | null
          eligibility_note?: string | null
          eligibility_status?: string | null
          foot?: string | null
          height_cm?: number | null
          id?: number | null
          image_url?: string | null
          is_binational?: boolean | null
          market_value_eur?: number | null
          name?: string | null
          nationalities?: Json | null
          on_loan_from?: string | null
          other_nationalities?: Json | null
          place_of_birth?: string | null
          player_category?: string | null
          position?: string | null
          season_assists?: number | null
          season_games?: number | null
          season_goals?: number | null
          season_minutes?: number | null
          season_rating?: number | null
          slug?: string | null
          source_urls?: string[] | null
          tier?: string | null
          transfermarkt_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          age?: number | null
          agent?: string | null
          caps_rdc?: number | null
          contract_expires?: string | null
          country_of_birth?: string | null
          created_at?: string | null
          current_club?: string | null
          current_club_id?: string | null
          date_of_birth?: string | null
          eligibility_note?: string | null
          eligibility_status?: string | null
          foot?: string | null
          height_cm?: number | null
          id?: number | null
          image_url?: string | null
          is_binational?: boolean | null
          market_value_eur?: number | null
          name?: string | null
          nationalities?: Json | null
          on_loan_from?: string | null
          other_nationalities?: Json | null
          place_of_birth?: string | null
          player_category?: string | null
          position?: string | null
          season_assists?: number | null
          season_games?: number | null
          season_goals?: number | null
          season_minutes?: number | null
          season_rating?: number | null
          slug?: string | null
          source_urls?: string[] | null
          tier?: string | null
          transfermarkt_id?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_newsletter_subscription: {
        Args: { _token: string }
        Returns: Json
      }
      get_newsletter_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      unsubscribe_newsletter: { Args: { _token: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
