import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getRecipes() {
  if (isLocalMode) return api.get<any[]>("/recipes");
  const s = await sb();
  const { data } = await s.from("recipes").select("*").order("title");
  return data || [];
}

export async function getRecipesPaginated(params: { search?: string; category?: string; page: number; pageSize: number }) {
  if (isLocalMode) {
    const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.search) qs.set("search", params.search);
    if (params.category && params.category !== "Alle") qs.set("category", params.category);
    return api.get<{ recipes: any[]; total: number }>(`/recipes/paginated?${qs}`);
  }
  const s = await sb();
  let query = s.from("recipes").select("*", { count: "exact" });
  if (params.category && params.category !== "Alle") query = query.eq("category", params.category);
  if (params.search) query = query.ilike("title", `%${params.search}%`);
  const { data, count } = await query.order("created_at", { ascending: false }).range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1);
  return { recipes: data || [], total: count || 0 };
}

export async function getRecipeById(id: string) {
  if (isLocalMode) return api.get<any>(`/recipes/${id}`);
  const s = await sb();
  const { data } = await s.from("recipes").select("*").eq("id", id).single();
  return data;
}

export async function createRecipe(recipe: any) {
  if (isLocalMode) return api.post<{ id: string }>("/recipes", recipe);
  const s = await sb();
  const { data } = await s.from("recipes").insert(recipe).select("id").single();
  return data;
}

export async function updateRecipe(id: string, recipe: any) {
  if (isLocalMode) return api.patch(`/recipes/${id}`, recipe);
  const s = await sb();
  await s.from("recipes").update(recipe).eq("id", id);
}

export async function deleteRecipe(id: string) {
  if (isLocalMode) return api.delete(`/recipes/${id}`);
  const s = await sb();
  await s.from("recipe_ingredients").delete().eq("recipe_id", id);
  await s.from("recipes").delete().eq("id", id);
}

export async function toggleRecipeFavorite(id: string, is_favorite: boolean) {
  if (isLocalMode) return api.patch(`/recipes/${id}`, { is_favorite });
  const s = await sb();
  await s.from("recipes").update({ is_favorite }).eq("id", id);
}
