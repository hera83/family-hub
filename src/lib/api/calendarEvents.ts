import { isLocalMode } from "@/config/env";
import { api } from "./client";

let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

export async function getNormalEvents(startStr: string, endStr: string) {
  if (isLocalMode) return api.get<any[]>(`/calendar-events?type=normal&start=${startStr}&end=${endStr}`);
  const s = await sb();
  const { data } = await s.from("calendar_events")
    .select("*, family_members(name, color)")
    .is("recurrence_type", null)
    .gte("event_date", startStr)
    .lte("event_date", endStr)
    .order("start_time");
  return data || [];
}

export async function getRecurringEvents(endStr: string) {
  if (isLocalMode) return api.get<any[]>(`/calendar-events?type=recurring&end=${endStr}`);
  const s = await sb();
  const { data } = await s.from("calendar_events")
    .select("*, family_members(name, color)")
    .not("recurrence_type", "is", null)
    .lte("event_date", endStr)
    .order("start_time");
  return data || [];
}

export async function upsertCalendarEvent(event: any) {
  if (isLocalMode) {
    if (event.id) return api.patch(`/calendar-events/${event.id}`, event);
    return api.post("/calendar-events", event);
  }
  const s = await sb();
  if (event.id) {
    await s.from("calendar_events").update(event).eq("id", event.id);
  } else {
    await s.from("calendar_events").insert(event);
  }
}

export async function getCalendarEventsAll() {
  if (isLocalMode) return api.get<any[]>("/calendar-events?type=all");
  const s = await sb();
  const { data } = await s.from("calendar_events").select("*").order("event_date");
  return data || [];
}

export async function deleteCalendarEvent(id: string) {
  if (isLocalMode) return api.delete(`/calendar-events/${id}`);
  const s = await sb();
  await s.from("calendar_events").delete().eq("id", id);
}
