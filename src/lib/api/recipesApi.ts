import { api } from "./client";
import type {
  Recipe,
  RecipeIngredient,
  RecipeCategory,
  PaginatedResponse,
} from "./types";

export const recipesApi = {
  // ── Recipe categories ──
  getCategories: () =>
    api.get<RecipeCategory[]>("/api/v1/recipes/categories"),

  createCategory: (cat: { name: string; sort_order: number }) =>
    api.post<RecipeCategory>("/api/v1/recipes/categories", cat),

  updateCategory: (id: string, data: Partial<RecipeCategory>) =>
    api.put<RecipeCategory>(`/api/v1/recipes/categories/${id}`, data),

  deleteCategory: (id: string, reassignCategory?: string | null) =>
    api.delete(`/api/v1/recipes/categories/${id}`, {
      params: { reassign_to: reassignCategory ?? undefined },
    }),

  // ── Recipes ──
  getAll: () =>
    api.get<Recipe[]>("/api/v1/recipes/items"),

  getPaginated: (params: {
    search?: string;
    category?: string;
    page?: number;
    page_size?: number;
  }) =>
    api.get<PaginatedResponse<Recipe>>("/api/v1/recipes/items", {
      params: params as Record<string, string | number>,
    }),

  getById: (id: string) =>
    api.get<Recipe>(`/api/v1/recipes/items/${id}`),

  getFull: (id: string) =>
    api.get<Recipe & { ingredients: RecipeIngredient[] }>(`/api/v1/recipes/items/${id}/full`),

  create: (recipe: Partial<Recipe>) =>
    api.post<Recipe>("/api/v1/recipes/items", recipe),

  update: (id: string, data: Partial<Recipe>) =>
    api.put<Recipe>(`/api/v1/recipes/items/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/v1/recipes/items/${id}`),

  // ── Recipe ingredients ──
  getIngredients: (recipeId: string) =>
    api.get<RecipeIngredient[]>(`/api/v1/recipes/items/${recipeId}/ingredients`),

  saveIngredients: (
    recipeId: string,
    ingredients: Array<{
      id?: string;
      product_id: string | null;
      name: string;
      quantity: number;
      unit: string;
      is_staple: boolean;
      _deleted?: boolean;
    }>
  ) =>
    api.put(`/api/v1/recipes/items/${recipeId}/ingredients`, { ingredients }),
};
