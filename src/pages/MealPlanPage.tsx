import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, X, UtensilsCrossed } from "lucide-react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { da } from "date-fns/locale";

const DAYS = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];
const CATEGORIES = ["Alle", "Forret", "Hovedret", "Dessert", "Pasta", "Vegetarisk", "Salat", "Suppe"];

export default function MealPlanPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectingDay, setSelectingDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [dragDay, setDragDay] = useState<number | null>(null);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const { data: mealPlans = [] } = useQuery({
    queryKey: ["meal_plans", weekStartStr],
    queryFn: async () => {
      const { data } = await supabase
        .from("meal_plans")
        .select("*, recipes(*)")
        .eq("week_start", weekStartStr)
        .order("day_of_week");
      return data || [];
    },
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data } = await supabase.from("recipes").select("*").order("title");
      return data || [];
    },
  });

  const filteredRecipes = useMemo(() => {
    let result = recipes;
    if (categoryFilter !== "Alle") result = result.filter((r: any) => r.category === categoryFilter);
    if (searchQuery) result = result.filter((r: any) => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [recipes, categoryFilter, searchQuery]);

  const favoriteRecipes = useMemo(() => recipes.filter((r: any) => r.is_favorite), [recipes]);

  const setMealPlan = useMutation({
    mutationFn: async ({ dayOfWeek, recipeId }: { dayOfWeek: number; recipeId: string | null }) => {
      const existing = mealPlans.find((mp: any) => mp.day_of_week === dayOfWeek);
      if (existing) {
        if (recipeId) {
          await supabase.from("meal_plans").update({ recipe_id: recipeId }).eq("id", existing.id);
        } else {
          await supabase.from("meal_plans").delete().eq("id", existing.id);
        }
      } else if (recipeId) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayOfWeek);
        await supabase.from("meal_plans").insert({
          day_of_week: dayOfWeek,
          recipe_id: recipeId,
          week_start: weekStartStr,
          plan_date: format(date, "yyyy-MM-dd"),
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meal_plans"] }),
  });

  const swapMeals = useMutation({
    mutationFn: async ({ fromDay, toDay }: { fromDay: number; toDay: number }) => {
      const fromPlan = mealPlans.find((mp: any) => mp.day_of_week === fromDay);
      const toPlan = mealPlans.find((mp: any) => mp.day_of_week === toDay);

      if (fromPlan && toPlan) {
        await supabase.from("meal_plans").update({ recipe_id: toPlan.recipe_id }).eq("id", fromPlan.id);
        await supabase.from("meal_plans").update({ recipe_id: fromPlan.recipe_id }).eq("id", toPlan.id);
      } else if (fromPlan && !toPlan) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + toDay);
        await supabase.from("meal_plans").insert({
          day_of_week: toDay,
          recipe_id: fromPlan.recipe_id,
          week_start: weekStartStr,
          plan_date: format(date, "yyyy-MM-dd"),
        });
        await supabase.from("meal_plans").delete().eq("id", fromPlan.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meal_plans"] }),
  });

  const getMealForDay = (dayIndex: number) => {
    const plan = mealPlans.find((mp: any) => mp.day_of_week === dayIndex);
    return plan?.recipes || null;
  };

  const handleDragStart = (dayIndex: number) => setDragDay(dayIndex);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetDay: number) => {
    if (dragDay !== null && dragDay !== targetDay) {
      swapMeals.mutate({ fromDay: dragDay, toDay: targetDay });
    }
    setDragDay(null);
  };

  const selectRecipe = (recipeId: string) => {
    if (selectingDay !== null) {
      setMealPlan.mutate({ dayOfWeek: selectingDay, recipeId });
      setSelectingDay(null);
    }
  };

  const clearMeal = (dayIndex: number) => {
    setMealPlan.mutate({ dayOfWeek: dayIndex, recipeId: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="min-h-[44px] min-w-[44px]">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">
            Uge {format(weekStart, "w", { locale: da })} – {format(weekStart, "yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="min-h-[44px] min-w-[44px]">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAYS.map((day, i) => {
          const recipe = getMealForDay(i);
          return (
            <div
              key={day}
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                dragDay === i ? "opacity-50" : ""
              }`}
              draggable={!!recipe}
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              onClick={() => !recipe && setSelectingDay(i)}
            >
              <div className="bg-muted px-3 py-2 text-sm font-medium text-center">{day}</div>
              {recipe ? (
                <div className="p-2 space-y-2">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-24 object-cover rounded" />
                  ) : (
                    <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
                      <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-sm font-medium truncate">{recipe.title}</div>
                  {recipe.prep_time && <div className="text-xs text-muted-foreground">{recipe.prep_time} min</div>}
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1 min-h-[36px] text-xs" onClick={(e) => { e.stopPropagation(); setSelectingDay(i); }}>Byt</Button>
                    <Button variant="ghost" size="icon" className="min-h-[36px] min-w-[36px] text-destructive" onClick={(e) => { e.stopPropagation(); clearMeal(i); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-center justify-center min-h-[160px]" onClick={() => setSelectingDay(i)}>
                  <div className="text-center text-muted-foreground">
                    <UtensilsCrossed className="h-8 w-8 mx-auto mb-1" />
                    <span className="text-xs">Vælg ret</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recipe selection dialog */}
      <Dialog open={selectingDay !== null} onOpenChange={() => setSelectingDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Vælg ret til {selectingDay !== null ? DAYS[selectingDay] : ""}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="alle">
            <TabsList className="w-full">
              <TabsTrigger value="favoritter" className="min-h-[44px]">Favoritter</TabsTrigger>
              <TabsTrigger value="alle" className="min-h-[44px]">Alle opskrifter</TabsTrigger>
            </TabsList>
            <TabsContent value="favoritter">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto p-1">
                {favoriteRecipes.map((r: any) => (
                  <div key={r.id} className="border rounded-lg p-2 cursor-pointer hover:bg-muted transition-colors" onClick={() => selectRecipe(r.id)}>
                    {r.image_url ? <img src={r.image_url} alt={r.title} className="w-full h-20 object-cover rounded mb-1" /> : <div className="w-full h-20 bg-muted rounded mb-1 flex items-center justify-center"><UtensilsCrossed className="h-6 w-6 text-muted-foreground" /></div>}
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.category}</div>
                  </div>
                ))}
                {favoriteRecipes.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Ingen favoritter endnu</p>}
              </div>
            </TabsContent>
            <TabsContent value="alle">
              <div className="space-y-3">
                <Input placeholder="Søg opskrifter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="min-h-[44px]" />
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Button key={cat} variant={categoryFilter === cat ? "default" : "outline"} size="sm" onClick={() => setCategoryFilter(cat)} className="min-h-[36px]">
                      {cat}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto p-1">
                  {filteredRecipes.map((r: any) => (
                    <div key={r.id} className="border rounded-lg p-2 cursor-pointer hover:bg-muted transition-colors" onClick={() => selectRecipe(r.id)}>
                      {r.image_url ? <img src={r.image_url} alt={r.title} className="w-full h-20 object-cover rounded mb-1" /> : <div className="w-full h-20 bg-muted rounded mb-1 flex items-center justify-center"><UtensilsCrossed className="h-6 w-6 text-muted-foreground" /></div>}
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.category}</div>
                    </div>
                  ))}
                  {filteredRecipes.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Ingen opskrifter fundet</p>}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
