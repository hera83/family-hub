import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getRecipeIngredients(recipeId: string) {
  if (isLocalMode) return api.get<any[]>(`/recipe-ingredients?recipeId=${recipeId}`);
  const s = await sb();
  const { data } = await s.from("recipe_ingredients").select("*, products(name)").eq("recipe_id", recipeId).order("created_at");
  return data || [];
}

export async function getRecipeIngredientsWithProducts(recipeId: string) {
  if (isLocalMode) return api.get<any[]>(`/recipe-ingredients?recipeId=${recipeId}&withProducts=true`);
  const s = await sb();
  const { data } = await s.from("recipe_ingredients")
    .select("*, products(name, category_id, unit, size_label, is_staple)")
    .eq("recipe_id", recipeId);
  return data || [];
}

export async function saveRecipeIngredients(
  recipeId: string,
  ingredients: { id?: string; product_id: string | null; product_name: string; quantity: number; unit: string; is_staple: boolean; _deleted?: boolean }[]
) {
  if (isLocalMode) return api.post(`/recipe-ingredients/batch`, { recipeId, ingredients });
  const s = await sb();
  const existing = ingredients.filter((i) => i.id && !i._deleted);
  const toDelete = ingredients.filter((i) => i.id && i._deleted);
  const toInsert = ingredients.filter((i) => !i.id && !i._deleted);

  if (toDelete.length > 0) {
    await s.from("recipe_ingredients").delete().in("id", toDelete.map((i) => i.id!));
  }
  for (const ing of existing) {
    await s.from("recipe_ingredients").update({
      product_id: ing.product_id,
      name: ing.product_name,
      quantity: Number(ing.quantity) || 1,
      unit: ing.unit,
      is_staple: ing.is_staple,
    }).eq("id", ing.id!);
  }
  if (toInsert.length > 0) {
    await s.from("recipe_ingredients").insert(
      toInsert.map((ing) => ({
        recipe_id: recipeId,
        product_id: ing.product_id,
        name: ing.product_name,
        quantity: Number(ing.quantity) || 1,
        unit: ing.unit,
        is_staple: ing.is_staple,
      }))
    );
  }
}
