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
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          member_id: string | null
          recurrence_days: number[] | null
          recurrence_type: string | null
          start_time: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          member_id?: string | null
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          start_time?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          member_id?: string | null
          recurrence_days?: number[] | null
          recurrence_type?: string | null
          start_time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      item_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          plan_date: string
          recipe_id: string | null
          week_start: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          plan_date: string
          recipe_id?: string | null
          week_start: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          plan_date?: string
          recipe_id?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          category_name: string | null
          created_at: string
          id: string
          order_id: string
          price: number | null
          product_name: string
          quantity: number
          size_label: string | null
          unit: string | null
        }
        Insert: {
          category_name?: string | null
          created_at?: string
          id?: string
          order_id: string
          price?: number | null
          product_name: string
          quantity?: number
          size_label?: string | null
          unit?: string | null
        }
        Update: {
          category_name?: string | null
          created_at?: string
          id?: string
          order_id?: string
          price?: number | null
          product_name?: string
          quantity?: number
          size_label?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          pdf_data: string | null
          status: string
          total_items: number
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          pdf_data?: string | null
          status?: string
          total_items?: number
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          pdf_data?: string | null
          status?: string
          total_items?: number
          total_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          calories_per_100g: number | null
          carbs_per_100g: number | null
          category_id: string | null
          created_at: string
          description: string | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          image_url: string | null
          is_favorite: boolean
          is_manual: boolean
          is_staple: boolean
          name: string
          price: number | null
          protein_per_100g: number | null
          size_label: string | null
          unit: string | null
        }
        Insert: {
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          is_manual?: boolean
          is_staple?: boolean
          name: string
          price?: number | null
          protein_per_100g?: number | null
          size_label?: string | null
          unit?: string | null
        }
        Update: {
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          is_manual?: boolean
          is_staple?: boolean
          name?: string
          price?: number | null
          protein_per_100g?: number | null
          size_label?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          is_staple: boolean
          name: string | null
          product_id: string | null
          quantity: number
          recipe_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_staple?: boolean
          name?: string | null
          product_id?: string | null
          quantity?: number
          recipe_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_staple?: boolean
          name?: string | null
          product_id?: string | null
          quantity?: number
          recipe_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_favorite: boolean
          is_manual: boolean
          prep_time: number | null
          title: string
          updated_at: string
          wait_time: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_favorite?: boolean
          is_manual?: boolean
          prep_time?: number | null
          title: string
          updated_at?: string
          wait_time?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_favorite?: boolean
          is_manual?: boolean
          prep_time?: number | null
          title?: string
          updated_at?: string
          wait_time?: number | null
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_checked: boolean
          is_ordered: boolean
          order_id: string | null
          ordered_at: string | null
          product_id: string | null
          product_name: string
          quantity: number
          recipe_id: string | null
          recipe_qty: number | null
          recipe_unit: string | null
          source_type: string
          unit: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean
          is_ordered?: boolean
          order_id?: string | null
          ordered_at?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          recipe_id?: string | null
          recipe_qty?: number | null
          recipe_unit?: string | null
          source_type?: string
          unit?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean
          is_ordered?: boolean
          order_id?: string | null
          ordered_at?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          recipe_id?: string | null
          recipe_qty?: number | null
          recipe_unit?: string | null
          source_type?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
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
