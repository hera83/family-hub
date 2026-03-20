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
    api.get<RecipeCategory[]>("/api/recipe-categories"),

  createCategory: (cat: { name: string; sort_order: number }) =>
    api.post<RecipeCategory>("/api/recipe-categories", cat),

  updateCategory: (id: string, data: Partial<RecipeCategory>) =>
    api.patch<RecipeCategory>(`/api/recipe-categories/${id}`, data),

  deleteCategory: (id: string, reassignCategory?: string | null) =>
    api.delete(`/api/recipe-categories/${id}`, {
      params: { reassign_to: reassignCategory ?? undefined },
    }),

  // ── Recipes ──
  getAll: () =>
    api.get<Recipe[]>("/api/recipes"),

  getPaginated: (params: {
    search?: string;
    category?: string;
    page?: number;
    page_size?: number;
  }) =>
    api.get<PaginatedResponse<Recipe>>("/api/recipes", {
      params: params as Record<string, string | number>,
    }),

  getById: (id: string) =>
    api.get<Recipe>(`/api/recipes/${id}`),

  create: (recipe: Partial<Recipe>) =>
    api.post<Recipe>("/api/recipes", recipe),

  update: (id: string, data: Partial<Recipe>) =>
    api.patch<Recipe>(`/api/recipes/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/recipes/${id}`),

  // ── Recipe ingredients ──
  getIngredients: (recipeId: string) =>
    api.get<RecipeIngredient[]>(`/api/recipes/${recipeId}/ingredients`),

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
    api.put(`/api/recipes/${recipeId}/ingredients`, { ingredients }),
};
