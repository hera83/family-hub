import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function uploadImage(file: File, folder: string = "uploads"): Promise<string> {
  if (isLocalMode) {
    const result = await api.upload(`/storage/upload?folder=${folder}`, file);
    return result.url;
  }
  const s = await sb();
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await s.storage.from("images").upload(path, file);
  if (error) throw error;
  const { data } = s.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}
