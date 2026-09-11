export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      error_logs: {
        Row: {
          context: Json
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string | null
          route: string | null
          stack: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          route?: string | null
          stack?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          route?: string | null
          stack?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invites: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          invited_by: string | null
          joined_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_verified: boolean
          license_number: string | null
          logo_url: string | null
          name: string
          phone: string | null
          rating: number | null
          review_count: number
          rut: string | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_verified?: boolean
          license_number?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          rating?: number | null
          review_count?: number
          rut?: string | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          license_number?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          rating?: number | null
          review_count?: number
          rut?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          plan: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          plan: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          plan?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_logo: string | null
          company_name: string | null
          created_at: string | null
          email: string
          id: string
          is_email_verified: boolean | null
          is_identity_verified: boolean | null
          is_phone_verified: boolean | null
          license_number: string | null
          name: string
          notifications_email: boolean | null
          notifications_push: boolean | null
          phone: string | null
          platform_role: string
          preferred_currency: Database["public"]["Enums"]["currency"] | null
          preferred_language: string | null
          push_token: string | null
          rating: number | null
          review_count: number | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          total_listings: number | null
          total_views: number | null
          trial_expires_at: string | null
          trial_started_at: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          id: string
          is_email_verified?: boolean | null
          is_identity_verified?: boolean | null
          is_phone_verified?: boolean | null
          license_number?: string | null
          name: string
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          phone?: string | null
          platform_role?: string
          preferred_currency?: Database["public"]["Enums"]["currency"] | null
          preferred_language?: string | null
          push_token?: string | null
          rating?: number | null
          review_count?: number | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          total_listings?: number | null
          total_views?: number | null
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_email_verified?: boolean | null
          is_identity_verified?: boolean | null
          is_phone_verified?: boolean | null
          license_number?: string | null
          name?: string
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          phone?: string | null
          platform_role?: string
          preferred_currency?: Database["public"]["Enums"]["currency"] | null
          preferred_language?: string | null
          push_token?: string | null
          rating?: number | null
          review_count?: number | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          total_listings?: number | null
          total_views?: number | null
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          whatsapp?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_city: string | null
          address_commune: string | null
          address_number: string | null
          address_postal_code: string | null
          address_region: string | null
          address_street: string | null
          area: number
          bathrooms: number | null
          bedrooms: number | null
          built_area: number | null
          client_request_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          contacts_count: number | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency"]
          deposit: number | null
          description: string
          expires_at: string | null
          favorites_count: number | null
          floor_plan_url: string | null
          floors: number | null
          furnished: boolean | null
          has_air_conditioning: boolean | null
          has_balcony: boolean | null
          has_elevator: boolean | null
          has_garden: boolean | null
          has_gym: boolean | null
          has_heating: boolean | null
          has_pool: boolean | null
          has_security: boolean | null
          has_terrace: boolean | null
          id: string
          images: Json | null
          is_featured: boolean | null
          is_negotiable: boolean | null
          is_premium: boolean | null
          latitude: number
          longitude: number
          lot_size: number | null
          maintenance_fee: number | null
          monthly_rent: number | null
          new_construction: boolean | null
          operation: Database["public"]["Enums"]["property_operation"]
          organization_id: string | null
          owner_id: string
          parking_spots: number | null
          pet_friendly: boolean | null
          preferred_contact:
            | Database["public"]["Enums"]["contact_method"]
            | null
          price: number
          price_per_sqm: number | null
          published_at: string | null
          search_vector: unknown
          status: Database["public"]["Enums"]["property_status"]
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string | null
          videos: Json | null
          views: number | null
          virtual_tour_url: string | null
          year_built: number | null
        }
        Insert: {
          address_city?: string | null
          address_commune?: string | null
          address_number?: string | null
          address_postal_code?: string | null
          address_region?: string | null
          address_street?: string | null
          area: number
          bathrooms?: number | null
          bedrooms?: number | null
          built_area?: number | null
          client_request_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          contacts_count?: number | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          deposit?: number | null
          description: string
          expires_at?: string | null
          favorites_count?: number | null
          floor_plan_url?: string | null
          floors?: number | null
          furnished?: boolean | null
          has_air_conditioning?: boolean | null
          has_balcony?: boolean | null
          has_elevator?: boolean | null
          has_garden?: boolean | null
          has_gym?: boolean | null
          has_heating?: boolean | null
          has_pool?: boolean | null
          has_security?: boolean | null
          has_terrace?: boolean | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_negotiable?: boolean | null
          is_premium?: boolean | null
          latitude: number
          longitude: number
          lot_size?: number | null
          maintenance_fee?: number | null
          monthly_rent?: number | null
          new_construction?: boolean | null
          operation: Database["public"]["Enums"]["property_operation"]
          organization_id?: string | null
          owner_id: string
          parking_spots?: number | null
          pet_friendly?: boolean | null
          preferred_contact?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          price: number
          price_per_sqm?: number | null
          published_at?: string | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["property_status"]
          tags?: string[] | null
          title: string
          type: Database["public"]["Enums"]["property_type"]
          updated_at?: string | null
          videos?: Json | null
          views?: number | null
          virtual_tour_url?: string | null
          year_built?: number | null
        }
        Update: {
          address_city?: string | null
          address_commune?: string | null
          address_number?: string | null
          address_postal_code?: string | null
          address_region?: string | null
          address_street?: string | null
          area?: number
          bathrooms?: number | null
          bedrooms?: number | null
          built_area?: number | null
          client_request_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          contacts_count?: number | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          deposit?: number | null
          description?: string
          expires_at?: string | null
          favorites_count?: number | null
          floor_plan_url?: string | null
          floors?: number | null
          furnished?: boolean | null
          has_air_conditioning?: boolean | null
          has_balcony?: boolean | null
          has_elevator?: boolean | null
          has_garden?: boolean | null
          has_gym?: boolean | null
          has_heating?: boolean | null
          has_pool?: boolean | null
          has_security?: boolean | null
          has_terrace?: boolean | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_negotiable?: boolean | null
          is_premium?: boolean | null
          latitude?: number
          longitude?: number
          lot_size?: number | null
          maintenance_fee?: number | null
          monthly_rent?: number | null
          new_construction?: boolean | null
          operation?: Database["public"]["Enums"]["property_operation"]
          organization_id?: string | null
          owner_id?: string
          parking_spots?: number | null
          pet_friendly?: boolean | null
          preferred_contact?:
            | Database["public"]["Enums"]["contact_method"]
            | null
          price?: number
          price_per_sqm?: number | null
          published_at?: string | null
          search_vector?: unknown
          status?: Database["public"]["Enums"]["property_status"]
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string | null
          videos?: Json | null
          views?: number | null
          virtual_tour_url?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          property_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          property_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          property_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          organization_id: string | null
          property_id: string | null
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          subject_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string
          id?: string
          organization_id?: string | null
          property_id?: string | null
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          subject_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          property_id?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_subject_id_fkey"
            columns: ["subject_id"]
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
      accept_pending_invites: { Args: never; Returns: undefined }
      admin_list_users: {
        Args: { search_term?: string }
        Returns: {
          company_name: string
          created_at: string
          email: string
          id: string
          is_email_verified: boolean
          is_phone_verified: boolean
          license_number: string
          name: string
          platform_role: string
          total_listings: number
          user_type: string
        }[]
      }
      admin_set_platform_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: undefined
      }
      admin_set_review_status: {
        Args: { new_status: string; review_id: string }
        Returns: undefined
      }
      admin_toggle_verified: {
        Args: { field: string; target_user_id: string; value: boolean }
        Returns: undefined
      }
      can_user_publish: { Args: { p_user_id: string }; Returns: boolean }
      create_org_invite: {
        Args: { inv_email: string; inv_org_id: string; inv_role: string }
        Returns: string
      }
      expire_stale_listings: { Args: never; Returns: number }
      find_user_for_org: {
        Args: { search_email: string }
        Returns: {
          email: string
          id: string
          name: string
        }[]
      }
      get_global_views: {
        Args: { days?: number }
        Returns: {
          count: number
          day: string
        }[]
      }
      get_org_members: {
        Args: { org_id: string }
        Returns: {
          email: string
          name: string
          role: string
          user_id: string
        }[]
      }
      get_org_views: {
        Args: { days?: number; org_id: string }
        Returns: {
          count: number
          day: string
        }[]
      }
      get_own_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          company_logo: string | null
          company_name: string | null
          created_at: string | null
          email: string
          id: string
          is_email_verified: boolean | null
          is_identity_verified: boolean | null
          is_phone_verified: boolean | null
          license_number: string | null
          name: string
          notifications_email: boolean | null
          notifications_push: boolean | null
          phone: string | null
          platform_role: string
          preferred_currency: Database["public"]["Enums"]["currency"] | null
          preferred_language: string | null
          push_token: string | null
          rating: number | null
          review_count: number | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          total_listings: number | null
          total_views: number | null
          trial_expires_at: string | null
          trial_started_at: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          whatsapp: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_owner_views: {
        Args: { days?: number; owner_id: string }
        Returns: {
          count: number
          day: string
        }[]
      }
      get_property_views: {
        Args: { days?: number; property_id: string }
        Returns: {
          count: number
          day: string
        }[]
      }
      increment_property_views: {
        Args: { property_id: string }
        Returns: undefined
      }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_admin_any: { Args: never; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_subscription_active: { Args: { p_user_id: string }; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      set_member_role: {
        Args: { new_role: string; org_id: string; target_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      contact_method: "phone" | "email" | "whatsapp" | "sms"
      currency: "CLP" | "USD"
      member_status: "invited" | "active" | "removed"
      notification_type:
        | "property_expiring"
        | "property_expired"
        | "new_favorite"
        | "price_change"
        | "new_message"
        | "payment_success"
        | "payment_failed"
        | "listing_approved"
        | "listing_rejected"
      org_role: "owner" | "admin" | "agent"
      org_type: "brokerage" | "company"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      property_operation: "sale" | "rent"
      property_status:
        | "active"
        | "expired"
        | "sold"
        | "rented"
        | "pending_review"
        | "rejected"
      property_type:
        | "house"
        | "apartment"
        | "land"
        | "office"
        | "commercial"
        | "warehouse"
      review_status: "published" | "flagged" | "removed"
      subscription_type: "free" | "premium"
      user_type: "individual" | "agent" | "company"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      contact_method: ["phone", "email", "whatsapp", "sms"],
      currency: ["CLP", "USD"],
      member_status: ["invited", "active", "removed"],
      notification_type: [
        "property_expiring",
        "property_expired",
        "new_favorite",
        "price_change",
        "new_message",
        "payment_success",
        "payment_failed",
        "listing_approved",
        "listing_rejected",
      ],
      org_role: ["owner", "admin", "agent"],
      org_type: ["brokerage", "company"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      property_operation: ["sale", "rent"],
      property_status: [
        "active",
        "expired",
        "sold",
        "rented",
        "pending_review",
        "rejected",
      ],
      property_type: [
        "house",
        "apartment",
        "land",
        "office",
        "commercial",
        "warehouse",
      ],
      review_status: ["published", "flagged", "removed"],
      subscription_type: ["free", "premium"],
      user_type: ["individual", "agent", "company"],
    },
  },
} as const

