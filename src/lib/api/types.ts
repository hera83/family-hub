/* ── Shared API response / domain types ── */

export interface FamilyMember {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  member_id: string | null;
  recurrence_type: string | null;
  recurrence_days: number[] | null;
  created_at: string;
  family_members?: { name: string; color: string } | null;
}

export interface ItemCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface RecipeCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string | null;
  size_label: string | null;
  price: number | null;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
  is_favorite: boolean;
  is_manual: boolean;
  is_staple: boolean;
  calories_per_100g: number | null;
  fat_per_100g: number | null;
  carbs_per_100g: number | null;
  protein_per_100g: number | null;
  fiber_per_100g: number | null;
  created_at: string;
  item_categories?: { name: string } | null;
}

export interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  description: string | null;
  category: string | null;
  prep_time: number | null;
  wait_time: number | null;
  instructions: string | null;
  is_manual: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  product_id: string | null;
  name: string | null;
  quantity: number;
  unit: string | null;
  is_staple: boolean;
  created_at: string;
  products?: { name: string } | null;
}

export interface ShoppingListItem {
  id: string;
  product_name: string;
  product_id: string | null;
  category_id: string | null;
  quantity: number;
  unit: string | null;
  source_type: string;
  recipe_id: string | null;
  recipe_qty: number | null;
  recipe_unit: string | null;
  meal_plan_id: string | null;
  is_checked: boolean;
  is_ordered: boolean;
  order_id: string | null;
  ordered_at: string | null;
  created_at: string;
  item_categories?: { name: string; sort_order: number } | null;
  recipes?: { title: string } | null;
}

export interface MealPlan {
  id: string;
  day_of_week: number;
  plan_date: string;
  week_start: string;
  recipe_id: string | null;
  created_at: string;
  recipes?: Recipe | null;
}

export interface Order {
  id: string;
  status: string;
  total_items: number;
  total_price: number | null;
  pdf_data: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderLine {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  unit: string | null;
  category_name: string | null;
  price: number | null;
  size_label: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
