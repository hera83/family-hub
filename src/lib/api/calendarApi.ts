import { api } from "./client";
import type { FamilyMember, CalendarEvent } from "./types";

export const calendarApi = {
  // ── Family Members ──
  getMembers: () =>
    api.get<FamilyMember[]>("/api/family-members"),

  createMember: (member: { name: string; color: string }) =>
    api.post<FamilyMember>("/api/family-members", member),

  updateMember: (id: string, data: Partial<FamilyMember>) =>
    api.patch<FamilyMember>(`/api/family-members/${id}`, data),

  deleteMember: (id: string) =>
    api.delete(`/api/family-members/${id}`),

  // ── Calendar Events ──
  getEvents: (params: { start: string; end: string; recurring?: boolean }) =>
    api.get<CalendarEvent[]>("/api/calendar-events", {
      params: {
        start: params.start,
        end: params.end,
        recurring: params.recurring != null ? String(params.recurring) : undefined,
      },
    }),

  getRecurringEvents: (endDate: string) =>
    api.get<CalendarEvent[]>("/api/calendar-events", {
      params: { end: endDate, recurring: "true" },
    }),

  createEvent: (event: Omit<CalendarEvent, "id" | "created_at" | "family_members">) =>
    api.post<CalendarEvent>("/api/calendar-events", event),

  updateEvent: (id: string, event: Partial<CalendarEvent>) =>
    api.patch<CalendarEvent>(`/api/calendar-events/${id}`, event),

  deleteEvent: (id: string) =>
    api.delete(`/api/calendar-events/${id}`),
};
