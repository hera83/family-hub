import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) {
    const mod = await import("@/integrations/supabase/client");
    _supabase = mod.supabase;
  }
  return _supabase;
}

export async function getFamilyMembers() {
  if (isLocalMode) return api.get<any[]>("/family-members");
  const s = await sb();
  const { data } = await s.from("family_members").select("*").order("created_at");
  return data || [];
}

export async function createFamilyMember(member: { name: string; color: string }) {
  if (isLocalMode) return api.post("/family-members", member);
  const s = await sb();
  await s.from("family_members").insert(member);
}

export async function updateFamilyMember(id: string, data: any) {
  if (isLocalMode) return api.patch(`/family-members/${id}`, data);
  const s = await sb();
  await s.from("family_members").update(data).eq("id", id);
}

export async function deleteFamilyMember(id: string) {
  if (isLocalMode) return api.delete(`/family-members/${id}`);
  const s = await sb();
  await s.from("family_members").delete().eq("id", id);
}
