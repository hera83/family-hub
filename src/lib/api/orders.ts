import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getOrders() {
  if (isLocalMode) return api.get<any[]>("/orders");
  const s = await sb();
  const { data } = await s.from("orders").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function createOrder(order: any) {
  if (isLocalMode) return api.post<any>("/orders", order);
  const s = await sb();
  const { data } = await s.from("orders").insert(order).select().single();
  return data;
}

export async function deleteOrder(id: string) {
  if (isLocalMode) return api.delete(`/orders/${id}`);
  const s = await sb();
  await s.from("order_lines").delete().eq("order_id", id);
  await s.from("orders").delete().eq("id", id);
}

export async function createOrderLines(lines: any[]) {
  if (isLocalMode) return api.post("/order-lines", lines);
  const s = await sb();
  await s.from("order_lines").insert(lines);
}

export async function getTopProductNames() {
  if (isLocalMode) return api.get<string[]>("/orders/top-products");
  const s = await sb();
  const { data } = await s.from("order_lines").select("product_name");
  if (!data) return [];
  const counts: Record<string, number> = {};
  data.forEach((l: any) => { counts[l.product_name] = (counts[l.product_name] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
}
