import { api } from "./client";
import type { ShoppingListItem } from "./types";

export const shoppingApi = {
  getItems: () =>
    api.get<ShoppingListItem[]>("/api/shopping-list"),

  addItem: (item: {
    product_name: string;
    product_id?: string | null;
    category_id?: string | null;
    quantity: number;
    unit?: string;
    source_type?: string;
    recipe_id?: string | null;
    recipe_qty?: number | null;
    recipe_unit?: string | null;
    meal_plan_id?: string | null;
  }) =>
    api.post<ShoppingListItem>("/api/shopping-list", item),

  updateItem: (id: string, data: Partial<ShoppingListItem>) =>
    api.patch<ShoppingListItem>(`/api/shopping-list/${id}`, data),

  deleteItem: (id: string) =>
    api.delete(`/api/shopping-list/${id}`),

  placeOrder: () =>
    api.post<{ order_id: string }>("/api/shopping-list/place-order"),

  /** Sync shopping list when a meal plan adds/removes a recipe */
  syncMealPlan: (params: {
    recipe_id: string;
    meal_plan_id: string;
    action: "add" | "remove";
  }) =>
    api.post("/api/shopping-list/sync-meal-plan", params),
};
