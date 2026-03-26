import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getItemCategories() {
  if (isLocalMode) return api.get<any[]>("/item-categories");
  const s = await sb();
  const { data } = await s.from("item_categories").select("*").order("sort_order");
  return data || [];
}

export async function createItemCategory(cat: { name: string; sort_order: number }) {
  if (isLocalMode) return api.post("/item-categories", cat);
  const s = await sb();
  await s.from("item_categories").insert(cat);
}

export async function updateItemCategory(id: string, data: any) {
  if (isLocalMode) return api.patch(`/item-categories/${id}`, data);
  const s = await sb();
  await s.from("item_categories").update(data).eq("id", id);
}

export async function deleteItemCategory(id: string) {
  if (isLocalMode) return api.delete(`/item-categories/${id}`);
  const s = await sb();
  await s.from("item_categories").delete().eq("id", id);
}
