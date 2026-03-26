import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getProducts() {
  if (isLocalMode) return api.get<any[]>("/products");
  const s = await sb();
  const { data } = await s.from("products").select("*, item_categories(name)").order("name");
  return data || [];
}

export async function createProduct(product: any) {
  if (isLocalMode) return api.post<any>("/products", product);
  const s = await sb();
  const { data } = await s.from("products").insert(product).select("*, item_categories(name)").single();
  return data;
}

export async function updateProduct(id: string, product: any) {
  if (isLocalMode) return api.patch(`/products/${id}`, product);
  const s = await sb();
  await s.from("products").update(product).eq("id", id);
}

export async function deleteProduct(id: string) {
  if (isLocalMode) return api.delete(`/products/${id}`);
  const s = await sb();
  await s.from("products").delete().eq("id", id);
}
