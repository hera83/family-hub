import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getMealPlans(weekStart: string) {
  if (isLocalMode) return api.get<any[]>(`/meal-plans?weekStart=${weekStart}`);
  const s = await sb();
  const { data } = await s.from("meal_plans").select("*, recipes(*)").eq("week_start", weekStart).order("day_of_week");
  return data || [];
}

export async function createMealPlan(plan: any) {
  if (isLocalMode) return api.post<any>("/meal-plans", plan);
  const s = await sb();
  const { data } = await s.from("meal_plans").insert(plan).select().single();
  return data;
}

export async function updateMealPlan(id: string, data: any) {
  if (isLocalMode) return api.patch(`/meal-plans/${id}`, data);
  const s = await sb();
  await s.from("meal_plans").update(data).eq("id", id);
}

export async function deleteMealPlan(id: string) {
  if (isLocalMode) return api.delete(`/meal-plans/${id}`);
  const s = await sb();
  await s.from("meal_plans").delete().eq("id", id);
}
