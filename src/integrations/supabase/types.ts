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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      best_sellers: {
        Row: {
          created_at: string
          custom_image: string | null
          display_order: number
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          custom_image?: string | null
          display_order?: number
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          custom_image?: string | null
          display_order?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "best_sellers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_banners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image?: string
        }
        Relationships: []
      }
      new_arrivals: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "new_arrivals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
          sale_price: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          sale_price: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          sale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available_as: string[]
          category: string
          created_at: string
          description: string
          display_order: number
          id: string
          image: string
          images: string[] | null
          variants: Json | null
          name: string
          price: number
          product_tags: string[]
          sizes: string[]
          stock_status: string
          updated_at: string
        }
        Insert: {
          available_as?: string[]
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image?: string
          images?: string[] | null
          variants?: Json | null
          name: string
          price?: number
          product_tags?: string[]
          sizes?: string[]
          stock_status?: string
          updated_at?: string
        }
        Update: {
          available_as?: string[]
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image?: string
          images?: string[] | null
          variants?: Json | null
          name?: string
          price?: number
          product_tags?: string[]
          sizes?: string[]
          stock_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          customer_name: string
          display_order: number
          id: string
          review_text: string
          stars: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          display_order?: number
          id?: string
          review_text: string
          stars?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          display_order?: number
          id?: string
          review_text?: string
          stars?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      spotted_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image?: string
        }
        Relationships: []
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

