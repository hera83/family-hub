import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Users, Trash2, Pencil } from "lucide-react";
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
  const [newEvent, setNewEvent] = useState({ title: "", description: "", event_date: "", start_time: "", end_time: "", member_id: "" });

  const { data: members = [] } = useQuery({
    queryKey: ["family_members"],
    queryFn: async () => {
      const { data } = await supabase.from("family_members").select("*").order("created_at");
      return data || [];
    },
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

  const { data: events = [] } = useQuery({
    queryKey: ["calendar_events", dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const startStr = format(dateRange.days[0], "yyyy-MM-dd");
      const endStr = format(dateRange.days[dateRange.days.length - 1], "yyyy-MM-dd");
      const { data } = await supabase
        .from("calendar_events")
        .select("*, family_members(name, color)")
        .gte("event_date", startStr)
        .lte("event_date", endStr)
        .order("start_time");
      return data || [];
    },
  });

  const addMember = useMutation({
    mutationFn: async (member: { name: string; color: string }) => {
      await supabase.from("family_members").insert(member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      setNewMember({ name: "", color: MUTED_COLORS[members.length % MUTED_COLORS.length] });
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      await supabase.from("family_members").update(data).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      setEditingMember(null);
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("family_members").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family_members"] });
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
    },
  });

  const addEvent = useMutation({
    mutationFn: async (event: any) => {
      if (event.id) {
        await supabase.from("calendar_events").update(event).eq("id", event.id);
      } else {
        await supabase.from("calendar_events").insert(event);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      setShowEventDialog(false);
      setEditingEvent(null);
      setNewEvent({ title: "", description: "", event_date: "", start_time: "", end_time: "", member_id: "" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("calendar_events").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar_events"] }),
  });

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
      title: "",
      description: "",
      event_date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      start_time: "",
      end_time: "",
      member_id: members[0]?.id || "",
    });
    setShowEventDialog(true);
  };

  const openEditEvent = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date,
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      member_id: event.member_id || "",
    });
    setShowEventDialog(true);
  };

  const getEventsForDay = (day: Date) => events.filter((e: any) => isSameDay(new Date(e.event_date), day));

  const getMemberColor = (memberId: string) => {
    const member = members.find((m: any) => m.id === memberId);
    return member?.color || "hsl(210, 15%, 70%)";
  };

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
      <div className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-7"} gap-1`}>
        {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map((d) => (
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
                  ? dayEvents.slice(0, 4).map((e: any) => (
                      <div
                        key={e.id}
                        className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer"
                        style={{ backgroundColor: getMemberColor(e.member_id), color: "white" }}
                        onClick={(ev) => { ev.stopPropagation(); openEditEvent(e); }}
                      >
                        {e.start_time ? `${e.start_time.slice(0, 5)} ` : ""}{e.title}
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

      {/* Member admin dialog */}
      <Dialog open={showMemberAdmin} onOpenChange={setShowMemberAdmin}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Familiemedlemmer</DialogTitle></DialogHeader>
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
          <DialogHeader><DialogTitle>{editingEvent ? "Rediger aktivitet" : "Ny aktivitet"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titel</Label><Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="min-h-[44px]" /></div>
            <div><Label>Dato</Label><Input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} className="min-h-[44px]" /></div>
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
          </div>
          <DialogFooter className="gap-2">
            {editingEvent && (
              <Button variant="destructive" onClick={() => { deleteEvent.mutate(editingEvent.id); setShowEventDialog(false); }} className="min-h-[44px]">Slet</Button>
            )}
            <Button
              onClick={() => {
                const payload: any = { ...newEvent };
                if (!payload.start_time) delete payload.start_time;
                if (!payload.end_time) delete payload.end_time;
                if (!payload.member_id) delete payload.member_id;
                if (editingEvent) payload.id = editingEvent.id;
                addEvent.mutate(payload);
              }}
              disabled={!newEvent.title || !newEvent.event_date}
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
          </DialogHeader>
          <div className="space-y-2">
            {showEventPopup &&
              getEventsForDay(showEventPopup.date)
                .filter((e: any) => e.member_id === showEventPopup.memberId)
                .map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                    <div>
                      <div className="font-medium text-sm">{e.title}</div>
                      {e.start_time && <div className="text-xs text-muted-foreground">{e.start_time.slice(0, 5)}{e.end_time ? ` – ${e.end_time.slice(0, 5)}` : ""}</div>}
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
