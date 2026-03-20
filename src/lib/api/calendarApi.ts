import { api } from "./client";
import type { FamilyMember, CalendarEvent } from "./types";

/** Map API camelCase response to frontend snake_case model */
function mapEvent(e: any): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    event_date: e.eventDate ?? e.event_date,
    start_time: e.startTime ?? e.start_time ?? null,
    end_time: e.endTime ?? e.end_time ?? null,
    member_id: e.familyMemberId ?? e.member_id ?? null,
    recurrence_type: e.recurrenceType ?? e.recurrence_type ?? null,
    recurrence_days: e.recurrenceDays ?? e.recurrence_days ?? null,
    created_at: e.createdAt ?? e.created_at ?? "",
    family_members: e.familyMemberName
      ? { name: e.familyMemberName, color: e.familyMemberColor || "" }
      : e.family_members ?? null,
  };
}

function mapMember(m: any): FamilyMember {
  return {
    id: m.id,
    name: m.name,
    color: m.color,
    created_at: m.createdAt ?? m.created_at ?? "",
  };
}

export const calendarApi = {
  // ── Family Members ──
  getMembers: () =>
    api.get<any[]>("/api/v1/calendar/members").then((list) => list.map(mapMember)),

  createMember: (member: { name: string; color: string }) =>
    api.post<any>("/api/v1/calendar/members", member).then(mapMember),

  updateMember: (id: string, data: Partial<FamilyMember>) =>
    api.put<any>(`/api/v1/calendar/members/${id}`, data).then(mapMember),

  deleteMember: (id: string) =>
    api.delete(`/api/v1/calendar/members/${id}`),

  // ── Calendar Events ──
  getEvents: (params: { start: string; end: string; recurring?: boolean }) =>
    api.get<any[]>("/api/v1/calendar/events", {
      params: {
        start: params.start,
        end: params.end,
        recurring: params.recurring != null ? String(params.recurring) : undefined,
      },
    }).then((list) => list.map(mapEvent)),

  getRecurringEvents: (endDate: string) =>
    api.get<any[]>("/api/v1/calendar/events", {
      params: { end: endDate, recurring: "true" },
    }).then((list) => list.map(mapEvent)),

  createEvent: (event: Omit<CalendarEvent, "id" | "created_at" | "family_members">) =>
    api.post<any>("/api/v1/calendar/events", event).then(mapEvent),

  updateEvent: (id: string, event: Partial<CalendarEvent>) =>
    api.put<any>(`/api/v1/calendar/events/${id}`, event).then(mapEvent),

  deleteEvent: (id: string) =>
    api.delete(`/api/v1/calendar/events/${id}`),
};
