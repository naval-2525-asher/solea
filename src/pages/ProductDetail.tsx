export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      orders: {
        Row: {
          id: string
          created_at: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string
          city: string
          province: string | null
          postcode: string | null
          region: string
          items: Json
          total: number
          delivery_charge: number | null
          transaction_id: string | null
          transaction_screenshot: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string
          city: string
          province?: string | null
          postcode?: string | null
          region: string
          items: Json
          total: number
          delivery_charge?: number | null
          transaction_id?: string | null
          transaction_screenshot?: string | null
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          address?: string
          city?: string
          province?: string | null
          postcode?: string | null
          region?: string
          items?: Json
          total?: number
          delivery_charge?: number | null
          transaction_id?: string | null
          transaction_screenshot?: string | null
          status?: string
        }
        Relationships: []
      }
      product_config: {
        Row: {
          id: string
          section: string
          product_type: string
          config: Json
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          section: string
          product_type: string
          config?: Json
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          section?: string
          product_type?: string
          config?: Json
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      sale_products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
          sale_price: number
          sale_price_gbp: number | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          sale_price: number
          sale_price_gbp?: number | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          sale_price?: number
          sale_price_gbp?: number | null
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
          custom_inputs: Json | null
          name: string
          price: number
          price_gbp: number | null
          stock_count: number | null
          product_tags: string[]
          size_stock: Json | null
          color_stock: Json | null
          tee_variants: Json | null
          tank_variants: Json | null
          sizes: string[]
          stock_status: string
          updated_at: string
          size_guide_tee: string | null
          size_guide_tank: string | null
          tee_description: string | null
          tank_description: string | null
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
          custom_inputs?: Json | null
          name: string
          price?: number
          price_gbp?: number | null
          stock_count?: number | null
          size_stock?: Json | null
          color_stock?: Json | null
          tee_variants?: Json | null
          tank_variants?: Json | null
          product_tags?: string[]
          sizes?: string[]
          stock_status?: string
          updated_at?: string
          size_guide_tee?: string | null
          size_guide_tank?: string | null
          tee_description?: string | null
          tank_description?: string | null
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
          custom_inputs?: Json | null
          name?: string
          price?: number
          price_gbp?: number | null
          stock_count?: number | null
          size_stock?: Json | null
          color_stock?: Json | null
          tee_variants?: Json | null
          tank_variants?: Json | null
          product_tags?: string[]
          sizes?: string[]
          stock_status?: string
          updated_at?: string
          size_guide_tee?: string | null
          size_guide_tank?: string | null
          tee_description?: string | null
          tank_description?: string | null
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
