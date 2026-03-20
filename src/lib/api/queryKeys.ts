/**
 * Centralized React Query key factory.
 * Using a factory keeps keys consistent and easy to invalidate.
 */
export const qk = {
  familyMembers: ["family_members"] as const,

  calendarEvents: (startDate: string, endDate: string) =>
    ["calendar_events", startDate, endDate] as const,
  recurringEvents: (endDate: string) =>
    ["recurring_events", endDate] as const,

  itemCategories: ["item_categories"] as const,
  recipeCategories: ["recipe_categories"] as const,

  products: ["products"] as const,
  productsCatalog: ["products_catalog"] as const,
  topProducts: ["top_products"] as const,

  recipes: ["recipes"] as const,
  recipesPaginated: (search: string, category: string, page: number) =>
    ["recipes_paginated", search, category, page] as const,
  recipeIngredients: (recipeId: string) =>
    ["recipe_ingredients", recipeId] as const,
  cookRecipe: (recipeId: string) =>
    ["cook_recipe", recipeId] as const,
  cookIngredients: (recipeId: string) =>
    ["cook_ingredients", recipeId] as const,

  shoppingListItems: ["shopping_list_items"] as const,

  mealPlans: (weekStart: string) =>
    ["meal_plans", weekStart] as const,
  mealPlanOrderStatus: (ids: string[]) =>
    ["meal_plan_order_status", ids] as const,

  orders: ["orders"] as const,
};
