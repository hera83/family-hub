import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getShoppingListItems() {
  if (isLocalMode) return api.get<any[]>("/shopping-list");
  const s = await sb();
  const { data } = await s.from("shopping_list_items")
    .select("*, item_categories(name, sort_order), recipes(title)")
    .eq("is_ordered", false)
    .order("created_at");
  return data || [];
}

export async function addShoppingListItem(item: any) {
  if (isLocalMode) return api.post("/shopping-list", item);
  const s = await sb();
  await s.from("shopping_list_items").insert(item);
}

export async function updateShoppingListItem(id: string, data: any) {
  if (isLocalMode) return api.patch(`/shopping-list/${id}`, data);
  const s = await sb();
  await s.from("shopping_list_items").update(data).eq("id", id);
}

export async function deleteShoppingListItem(id: string) {
  if (isLocalMode) return api.delete(`/shopping-list/${id}`);
  const s = await sb();
  await s.from("shopping_list_items").delete().eq("id", id);
}

export async function deleteShoppingListByMealPlan(mealPlanId: string) {
  if (isLocalMode) return api.delete(`/shopping-list/by-meal-plan/${mealPlanId}`);
  const s = await sb();
  await s.from("shopping_list_items").delete().eq("meal_plan_id", mealPlanId).eq("is_ordered", false);
}

export async function markItemsOrdered(ids: string[], orderId: string) {
  if (isLocalMode) return api.post("/shopping-list/mark-ordered", { ids, orderId });
  const s = await sb();
  await s.from("shopping_list_items").update({
    is_ordered: true,
    order_id: orderId,
    ordered_at: new Date().toISOString(),
  }).in("id", ids);
}

export async function getMealPlanOrderStatus(mealPlanIds: string[]) {
  if (isLocalMode) return api.post<any>("/shopping-list/meal-plan-status", { mealPlanIds });
  const s = await sb();
  const { data } = await s.from("shopping_list_items")
    .select("meal_plan_id, is_ordered, ordered_at")
    .in("meal_plan_id", mealPlanIds);
  if (!data) return {};
  const statusMap: Record<string, { total: number; ordered: number; latestOrderedAt: string | null }> = {};
  data.forEach((item: any) => {
    if (!item.meal_plan_id) return;
    if (!statusMap[item.meal_plan_id]) statusMap[item.meal_plan_id] = { total: 0, ordered: 0, latestOrderedAt: null };
    statusMap[item.meal_plan_id].total++;
    if (item.is_ordered) {
      statusMap[item.meal_plan_id].ordered++;
      if (!statusMap[item.meal_plan_id].latestOrderedAt || item.ordered_at > statusMap[item.meal_plan_id].latestOrderedAt!)
        statusMap[item.meal_plan_id].latestOrderedAt = item.ordered_at;
    }
  });
  return statusMap;
}
