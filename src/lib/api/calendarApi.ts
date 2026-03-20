import { api } from "./client";
import type { FamilyMember, CalendarEvent } from "./types";

export const calendarApi = {
  // ── Family Members ──
  getMembers: () =>
    api.get<FamilyMember[]>("/api/v1/calendar/members"),

  createMember: (member: { name: string; color: string }) =>
    api.post<FamilyMember>("/api/v1/calendar/members", member),

  updateMember: (id: string, data: Partial<FamilyMember>) =>
    api.put<FamilyMember>(`/api/v1/calendar/members/${id}`, data),

  deleteMember: (id: string) =>
    api.delete(`/api/v1/calendar/members/${id}`),

  // ── Calendar Events ──
  getEvents: (params: { start: string; end: string; recurring?: boolean }) =>
    api.get<CalendarEvent[]>("/api/v1/calendar/events", {
      params: {
        start: params.start,
        end: params.end,
        recurring: params.recurring != null ? String(params.recurring) : undefined,
      },
    }),

  getRecurringEvents: (endDate: string) =>
    api.get<CalendarEvent[]>("/api/v1/calendar/events", {
      params: { end: endDate, recurring: "true" },
    }),

  createEvent: (event: Omit<CalendarEvent, "id" | "created_at" | "family_members">) =>
    api.post<CalendarEvent>("/api/v1/calendar/events", event),

  updateEvent: (id: string, event: Partial<CalendarEvent>) =>
    api.put<CalendarEvent>(`/api/v1/calendar/events/${id}`, event),

  deleteEvent: (id: string) =>
    api.delete(`/api/v1/calendar/events/${id}`),
};
