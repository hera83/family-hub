import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getRecipeCategories() {
  if (isLocalMode) return api.get<any[]>("/recipe-categories");
  const s = await sb();
  const { data } = await s.from("recipe_categories").select("*").order("sort_order");
  return data || [];
}

export async function createRecipeCategory(cat: { name: string; sort_order: number }) {
  if (isLocalMode) return api.post("/recipe-categories", cat);
  const s = await sb();
  await s.from("recipe_categories").insert(cat);
}

export async function updateRecipeCategory(id: string, data: any) {
  if (isLocalMode) return api.patch(`/recipe-categories/${id}`, data);
  const s = await sb();
  await s.from("recipe_categories").update(data).eq("id", id);
}

export async function deleteRecipeCategory(id: string) {
  if (isLocalMode) return api.delete(`/recipe-categories/${id}`);
  const s = await sb();
  await s.from("recipe_categories").delete().eq("id", id);
}

/** Rename category on all recipes that use it */
export async function renameRecipeCategoryOnRecipes(oldName: string, newName: string) {
  if (isLocalMode) return api.post("/recipe-categories/rename-on-recipes", { oldName, newName });
  const s = await sb();
  await s.from("recipes").update({ category: newName }).eq("category", oldName);
}

/** Clear category on recipes when a category is deleted */
export async function clearRecipeCategoryOnRecipes(categoryName: string) {
  if (isLocalMode) return api.post("/recipe-categories/clear-on-recipes", { categoryName });
  const s = await sb();
  await s.from("recipes").update({ category: null }).eq("category", categoryName);
}
