import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFamilyMembers, createFamilyMember, updateFamilyMember, deleteFamilyMember, getNormalEvents, getRecurringEvents, upsertCalendarEvent, deleteCalendarEvent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Users, Trash2, Pencil, Repeat } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameMonth,
  isToday,
  getDay,
  getDate,
  getMonth,
  getDayOfYear,
  isBefore,
  parseISO,
} from "date-fns";
import { da } from "date-fns/locale";

const MUTED_COLORS = [
  "hsl(210, 30%, 65%)",
  "hsl(340, 25%, 65%)",
  "hsl(160, 25%, 55%)",
  "hsl(30, 35%, 60%)",
  "hsl(270, 20%, 65%)",
  "hsl(190, 30%, 55%)",
];

const DAY_LABELS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const DAY_OPTIONS = [
  { value: 1, label: "Mandag" },
  { value: 2, label: "Tirsdag" },
  { value: 3, label: "Onsdag" },
  { value: 4, label: "Torsdag" },
  { value: 5, label: "Fredag" },
  { value: 6, label: "Lørdag" },
  { value: 7, label: "Søndag" },
];

function toISODay(jsDay: number) {
  return jsDay === 0 ? 7 : jsDay;
}

function recursFallsOnDay(event: any, day: Date): boolean {
  // Parse date as local (not UTC) by appending T00:00:00
  const dateStr = typeof event.event_date === "string" ? event.event_date.split("T")[0] : event.event_date;
  const eventStart = new Date(dateStr + "T00:00:00");
  if (isBefore(day, eventStart)) return false;

  switch (event.recurrence_type) {
    case "weekly": {
      const isoDayOfWeek = toISODay(getDay(day));
      return (event.recurrence_days as number[] || []).includes(isoDayOfWeek);
    }
    case "monthly":
      return getDate(day) === getDate(eventStart);
    case "yearly":
      return getDate(day) === getDate(eventStart) && getMonth(day) === getMonth(eventStart);
    default:
      return false;
  }
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [showMemberAdmin, setShowMemberAdmin] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showEventPopup, setShowEventPopup] = useState<{ date: Date; memberId: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newMember, setNewMember] = useState({ name: "", color: MUTED_COLORS[0] });
  const [newEvent, setNewEvent] = useState({
    title: "", description: "", event_date: "", start_time: "", end_time: "", member_id: "",
    recurrence_type: "" as "" | "weekly" | "monthly" | "yearly",
    recurrence_days: [] as number[],
  });

  const { data: members = [] } = useQuery({
    queryKey: ["family_members"],
    queryFn: () => getFamilyMembers(),
  });

  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end, days: eachDayOfInterval({ start, end }) };
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthStart = startOfWeek(start, { weekStartsOn: 1 });
    const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
    return { start, end, days: eachDayOfInterval({ start: monthStart, end: monthEnd }) };
  }, [currentDate, viewMode]);

  const { data: normalEvents = [] } = useQuery({
    queryKey: ["calendar_events", dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => {
      const startStr = format(dateRange.days[0], "yyyy-MM-dd");
      const endStr = format(dateRange.days[dateRange.days.length - 1], "yyyy-MM-dd");
      return getNormalEvents(startStr, endStr);
    },
  });

  const { data: recurringEvents = [] } = useQuery({
    queryKey: ["recurring_events", dateRange.days[dateRange.days.length - 1].toISOString()],
    queryFn: () => {
      const endStr = format(dateRange.days[dateRange.days.length - 1], "yyyy-MM-dd");
      return getRecurringEvents(endStr);
    },
  });

  const addMember = useMutation({
    mutationFn: (member: { name: string; color: string }) => createFamilyMember(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      setNewMember({ name: "", color: MUTED_COLORS[members.length % MUTED_COLORS.length] });
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...data }: any) => updateFamilyMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      queryClient.invalidateQueries({ queryKey: ["recurring_events"] });
      setEditingMember(null);
    },
  });

  const deleteMember = useMutation({
    mutationFn: (id: string) => deleteFamilyMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      queryClient.invalidateQueries({ queryKey: ["recurring_events"] });
    },
  });

  const addEvent = useMutation({
    mutationFn: (event: any) => upsertCalendarEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      queryClient.invalidateQueries({ queryKey: ["recurring_events"] });
      setShowEventDialog(false);
      setEditingEvent(null);
      resetEventForm();
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      queryClient.invalidateQueries({ queryKey: ["recurring_events"] });
    },
  });

  const resetEventForm = () => {
    setNewEvent({ title: "", description: "", event_date: "", start_time: "", end_time: "", member_id: "", recurrence_type: "", recurrence_days: [] });
  };

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const openAddEvent = (date?: Date) => {
    setEditingEvent(null);
    setNewEvent({
      title: "", description: "",
      event_date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      start_time: "", end_time: "",
      member_id: members[0]?.id || "",
      recurrence_type: "",
      recurrence_days: [],
    });
    setShowEventDialog(true);
  };

  const openEditEvent = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date?.includes("T") ? event.event_date.split("T")[0] : event.event_date,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      member_id: event.member_id || "",
      recurrence_type: event.recurrence_type || "",
      recurrence_days: event.recurrence_days || [],
    });
    setShowEventDialog(true);
  };

  const getEventsForDay = (day: Date) => {
    const normal = normalEvents.filter((e: any) => isSameDay(parseISO(e.event_date), day));
    const recurring = recurringEvents.filter((e: any) => recursFallsOnDay(e, day)).map((e: any) => ({
      ...e,
      _virtualDate: format(day, "yyyy-MM-dd"),
    }));
    return [...normal, ...recurring];
  };

  const getMemberColor = (memberId: string) => {
    const member = members.find((m: any) => m.id === memberId);
    return member?.color || "hsl(210, 15%, 70%)";
  };

  const getMemberName = (memberId: string) => {
    const member = members.find((m: any) => m.id === memberId);
    return member?.name || "Ukendt";
  };

  const recurrenceLabel = (event: any) => {
    if (!event.recurrence_type) return null;
    if (event.recurrence_type === "weekly") {
      const dayNames = (event.recurrence_days || []).sort((a: number, b: number) => a - b).map((d: number) => DAY_OPTIONS.find(o => o.value === d)?.label?.slice(0, 3) || "");
      return `Hver ${dayNames.join(", ")}`;
    }
    if (event.recurrence_type === "monthly") return "Hver måned";
    if (event.recurrence_type === "yearly") return "Hvert år";
    return null;
  };

  const toggleRecurrenceDay = (day: number) => {
    setNewEvent(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter(d => d !== day)
        : [...prev.recurrence_days, day],
    }));
  };

  // Build week activity table data: group all events by member for the week
  const weekActivityData = useMemo(() => {
    if (viewMode !== "week") return [];
    const memberMap: Record<string, { memberId: string; name: string; color: string; activities: { day: Date; events: any[] }[] }> = {};

    dateRange.days.forEach((day) => {
      const dayEvents = getEventsForDay(day);
      dayEvents.forEach((e: any) => {
        const mid = e.member_id || "none";
        if (!memberMap[mid]) {
          memberMap[mid] = {
            memberId: mid,
            name: getMemberName(mid),
            color: getMemberColor(mid),
            activities: dateRange.days.map(d => ({ day: d, events: [] })),
          };
        }
        const dayIdx = dateRange.days.findIndex(d => isSameDay(d, day));
        if (dayIdx >= 0) memberMap[mid].activities[dayIdx].events.push(e);
      });
    });

    // Only include members that have at least one event
    return Object.values(memberMap).filter(m => m.activities.some(a => a.events.length > 0));
  }, [viewMode, dateRange.days, normalEvents, recurringEvents, members]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")} className="min-h-[44px] min-w-[44px]">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {viewMode === "week"
              ? `${format(dateRange.days[0], "d. MMM", { locale: da })} – ${format(dateRange.days[6], "d. MMM yyyy", { locale: da })}`
              : format(currentDate, "MMMM yyyy", { locale: da })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => navigate("next")} className="min-h-[44px] min-w-[44px]">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "week" ? "default" : "outline"} onClick={() => setViewMode("week")} className="min-h-[44px]">
            Uge
          </Button>
          <Button variant={viewMode === "month" ? "default" : "outline"} onClick={() => setViewMode("month")} className="min-h-[44px]">
            Måned
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowMemberAdmin(true)} className="min-h-[44px] min-w-[44px]">
            <Users className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={() => openAddEvent()} className="min-h-[44px] min-w-[44px]">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Member legend */}
      <div className="flex flex-wrap gap-3">
        {members.map((m: any) => (
          <div key={m.id} className="flex items-center gap-1.5 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-muted-foreground">{m.name}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
        {dateRange.days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = viewMode === "month" ? isSameMonth(day, currentDate) : true;
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] md:min-h-[120px] border rounded-md p-1 cursor-pointer transition-colors hover:bg-muted/50 ${
                isToday(day) ? "border-primary bg-primary/5" : "border-border"
              } ${!isCurrentMonth ? "opacity-40" : ""}`}
              onClick={() => openAddEvent(day)}
            >
              <div className={`text-xs font-medium mb-1 ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {viewMode === "week"
                  ? dayEvents.slice(0, 4).map((e: any, i: number) => (
                      <div
                        key={e.id + (e._virtualDate || "") + i}
                        className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer flex items-center gap-0.5"
                        style={{ backgroundColor: getMemberColor(e.member_id), color: "white" }}
                        onClick={(ev) => { ev.stopPropagation(); openEditEvent(e); }}
                      >
                        {e.recurrence_type && <Repeat className="h-2.5 w-2.5 shrink-0" />}
                        <span className="truncate">{e.start_time ? `${e.start_time.slice(0, 5)} ` : ""}{e.title}</span>
                      </div>
                    ))
                  : (() => {
                      const grouped = dayEvents.reduce((acc: any, e: any) => {
                        const mid = e.member_id || "none";
                        if (!acc[mid]) acc[mid] = [];
                        acc[mid].push(e);
                        return acc;
                      }, {});
                      return Object.entries(grouped).slice(0, 3).map(([mid, evts]: any) => (
                        <div
                          key={mid}
                          className="text-xs px-1 py-0.5 rounded cursor-pointer flex items-center gap-1"
                          style={{ backgroundColor: getMemberColor(mid), color: "white" }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setShowEventPopup({ date: day, memberId: mid });
                          }}
                        >
                          <span className="truncate">{evts.length} aktivitet{evts.length > 1 ? "er" : ""}</span>
                        </div>
                      ));
                    })()}
                {dayEvents.length > 4 && viewMode === "week" && (
                  <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 4} mere</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week activity table - only in week view */}
      {viewMode === "week" && weekActivityData.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-2 font-medium text-muted-foreground whitespace-nowrap">Medlem</th>
                {dateRange.days.map((day) => (
                  <th key={day.toISOString()} className={`text-center p-2 font-medium whitespace-nowrap ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE d.", { locale: da })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekActivityData.map((member) => (
                <tr key={member.memberId} className="border-t">
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: member.color }} />
                      <span className="font-medium text-sm">{member.name}</span>
                    </div>
                  </td>
                  {member.activities.map((act, dayIdx) => (
                    <td key={dayIdx} className="p-1 align-top">
                      <div className="space-y-0.5">
                        {act.events.map((e: any, i: number) => (
                          <div
                            key={e.id + i}
                            className="text-xs px-1.5 py-0.5 rounded cursor-pointer truncate hover:opacity-80"
                            style={{ backgroundColor: member.color, color: "white" }}
                            onClick={() => openEditEvent(e)}
                          >
                            {e.start_time ? `${e.start_time.slice(0, 5)} ` : ""}{e.title}
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member admin dialog */}
      <Dialog open={showMemberAdmin} onOpenChange={setShowMemberAdmin}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Familiemedlemmer</DialogTitle><DialogDescription>Administrer familiemedlemmer og deres farver</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2">
                {editingMember?.id === m.id ? (
                  <>
                    <input type="color" value={editingMember.color} onChange={(e) => setEditingMember({ ...editingMember, color: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
                    <Input value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} className="flex-1 min-h-[44px]" />
                    <Button size="sm" onClick={() => updateMember.mutate(editingMember)} className="min-h-[44px]">Gem</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingMember(null)} className="min-h-[44px]">Annuller</Button>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="flex-1">{m.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingMember({ ...m })} className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMember.mutate(m.id)} className="min-h-[44px] min-w-[44px] text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t">
              <input type="color" value={newMember.color} onChange={(e) => setNewMember({ ...newMember, color: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
              <Input placeholder="Nyt medlem..." value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="flex-1 min-h-[44px]" />
              <Button onClick={() => newMember.name && addMember.mutate(newMember)} disabled={!newMember.name} className="min-h-[44px]">Tilføj</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit event dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingEvent ? "Rediger aktivitet" : "Ny aktivitet"}</DialogTitle><DialogDescription>Udfyld detaljer for aktiviteten</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titel</Label><Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="min-h-[44px]" /></div>
            <div><Label>{newEvent.recurrence_type ? "Startdato" : "Dato"}</Label><Input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} className="min-h-[44px]" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Start</Label><Input type="time" value={newEvent.start_time} onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })} className="min-h-[44px]" /></div>
              <div><Label>Slut</Label><Input type="time" value={newEvent.end_time} onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })} className="min-h-[44px]" /></div>
            </div>
            <div>
              <Label>Medlem</Label>
              <select
                value={newEvent.member_id}
                onChange={(e) => setNewEvent({ ...newEvent, member_id: e.target.value })}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Vælg medlem...</option>
                {members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div><Label>Beskrivelse</Label><Input value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="min-h-[44px]" /></div>

            {/* Recurrence section */}
            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Gentagelse</Label>
              </div>
              <select
                value={newEvent.recurrence_type}
                onChange={(e) => setNewEvent({ ...newEvent, recurrence_type: e.target.value as any, recurrence_days: [] })}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Ingen gentagelse</option>
                <option value="weekly">Ugentlig</option>
                <option value="monthly">Månedlig</option>
                <option value="yearly">Årlig</option>
              </select>

              {newEvent.recurrence_type === "weekly" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Vælg dage</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleRecurrenceDay(d.value)}
                        className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] transition-colors border ${
                          newEvent.recurrence_days.includes(d.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-input hover:bg-muted"
                        }`}
                      >
                        {d.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newEvent.recurrence_type === "monthly" && (
                <p className="text-xs text-muted-foreground">
                  Gentages den {newEvent.event_date ? format(parseISO(newEvent.event_date), "d.") : "valgte dato"} hver måned
                </p>
              )}

              {newEvent.recurrence_type === "yearly" && (
                <p className="text-xs text-muted-foreground">
                  Gentages den {newEvent.event_date ? format(parseISO(newEvent.event_date), "d. MMMM", { locale: da }) : "valgte dato"} hvert år
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingEvent && (
              <Button variant="destructive" onClick={() => { deleteEvent.mutate(editingEvent.id); setShowEventDialog(false); }} className="min-h-[44px]">
                {editingEvent.recurrence_type ? "Slet alle" : "Slet"}
              </Button>
            )}
            <Button
              onClick={() => {
                const payload: any = {
                  title: newEvent.title,
                  description: newEvent.description || null,
                  event_date: newEvent.event_date,
                  start_time: newEvent.start_time || null,
                  end_time: newEvent.end_time || null,
                  member_id: newEvent.member_id || null,
                  recurrence_type: newEvent.recurrence_type || null,
                  recurrence_days: newEvent.recurrence_type === "weekly" && newEvent.recurrence_days.length > 0
                    ? newEvent.recurrence_days
                    : null,
                };
                if (editingEvent) payload.id = editingEvent.id;
                addEvent.mutate(payload);
              }}
              disabled={!newEvent.title || !newEvent.event_date || (newEvent.recurrence_type === "weekly" && newEvent.recurrence_days.length === 0)}
              className="min-h-[44px]"
            >
              {editingEvent ? "Gem" : "Opret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Events popup for grouped month view */}
      <Dialog open={!!showEventPopup} onOpenChange={() => setShowEventPopup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {showEventPopup && format(showEventPopup.date, "d. MMMM", { locale: da })} – {members.find((m: any) => m.id === showEventPopup?.memberId)?.name}
            </DialogTitle>
            <DialogDescription>Aktiviteter for dette medlem på denne dag</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {showEventPopup &&
              getEventsForDay(showEventPopup.date)
                .filter((e: any) => e.member_id === showEventPopup.memberId)
                .map((e: any, i: number) => (
                  <div key={e.id + i} className="flex items-center justify-between p-2 rounded-md bg-muted">
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1">
                        {e.recurrence_type && <Repeat className="h-3 w-3" />}
                        {e.title}
                      </div>
                      {e.start_time && <div className="text-xs text-muted-foreground">{e.start_time.slice(0, 5)}{e.end_time ? ` – ${e.end_time.slice(0, 5)}` : ""}</div>}
                      {recurrenceLabel(e) && <div className="text-xs text-muted-foreground">{recurrenceLabel(e)}</div>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => { setShowEventPopup(null); openEditEvent(e); }} className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                  </div>
                ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
