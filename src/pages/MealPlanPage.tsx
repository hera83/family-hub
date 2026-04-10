import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getRecipes, getRecipeCategories, getMealPlans, createMealPlan, updateMealPlan, deleteMealPlan, getRecipeIngredientsWithProducts, addShoppingListItem, deleteShoppingListByMealPlan, getMealPlanOrderStatus as fetchMealPlanOrderStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, X, UtensilsCrossed, ArrowLeftRight, Flag, CookingPot } from "lucide-react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { da } from "date-fns/locale";

const DAYS = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];

function normalizeToBase(qty: number, unit: string): { value: number; type: "weight" | "volume" | "unknown" } {
  const u = unit.toLowerCase().trim();
  if (u === "kg") return { value: qty * 1000, type: "weight" };
  if (u === "g") return { value: qty, type: "weight" };
  if (u === "l") return { value: qty * 1000, type: "volume" };
  if (u === "dl") return { value: qty * 100, type: "volume" };
  if (u === "cl") return { value: qty * 10, type: "volume" };
  if (u === "ml") return { value: qty, type: "volume" };
  return { value: qty, type: "unknown" };
}

function convertToPackages(recipeQty: number, recipeUnit: string, productSizeLabel: string | null, productUnit: string | null): number {
  if (!productSizeLabel || !productUnit) return recipeQty;
  const sizeMatch = productSizeLabel.match(/(\d+(?:[.,]\d+)?)/);
  if (!sizeMatch) return recipeQty;
  const productSize = parseFloat(sizeMatch[1].replace(",", "."));
  if (productSize <= 0) return recipeQty;
  const recipe = normalizeToBase(recipeQty, recipeUnit);
  const product = normalizeToBase(productSize, productUnit);
  if (recipe.type === "unknown" || product.type === "unknown" || recipe.type !== product.type) {
    return recipeQty;
  }
  return Math.ceil(recipe.value / product.value);
}

async function syncShoppingListForMealPlan(recipeId: string, mealPlanId: string, action: "add" | "remove") {
  const ingredients = await getRecipeIngredientsWithProducts(recipeId);
  if (!ingredients || ingredients.length === 0) return;

  if (action === "add") {
    for (const ing of ingredients) {
      if (ing.is_staple || ing.products?.is_staple) continue;
      const qty = convertToPackages(
        ing.quantity, ing.unit || "stk",
        ing.products?.size_label || null, ing.products?.unit || null
      );
      await addShoppingListItem({
        product_name: ing.products?.name || ing.name || "Ukendt",
        product_id: ing.product_id,
        category_id: ing.products?.category_id || null,
        quantity: qty,
        unit: ing.products?.unit || ing.unit || "stk",
        source_type: "recipe",
        recipe_id: recipeId,
        recipe_qty: ing.quantity,
        recipe_unit: ing.unit || "stk",
        meal_plan_id: mealPlanId,
      });
    }
  } else {
    await deleteShoppingListByMealPlan(mealPlanId);
  }
}

export default function MealPlanPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectingDay, setSelectingDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [dragDay, setDragDay] = useState<number | null>(null);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const { data: mealPlans = [] } = useQuery({
    queryKey: ["meal_plans", weekStartStr],
    queryFn: () => getMealPlans(weekStartStr),
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => getRecipes(),
  });

  const { data: recipeCategories = [] } = useQuery({
    queryKey: ["recipe_categories"],
    queryFn: () => getRecipeCategories(),
  });

  const CATEGORIES = useMemo(() => {
    return ["Alle", ...recipeCategories.map((c: any) => c.name)];
  }, [recipeCategories]);

  // Fetch order status per meal_plan entry id in one query
  const mealPlanIds = useMemo(() => {
    return mealPlans.map((mp: any) => mp.id).filter(Boolean) as string[];
  }, [mealPlans]);

  const { data: mealPlanOrderStatus = {} } = useQuery({
    queryKey: ["meal_plan_order_status", mealPlanIds],
    enabled: mealPlanIds.length > 0,
    queryFn: () => fetchMealPlanOrderStatus(mealPlanIds),
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

      if (existing?.recipe_id && existing.recipe_id !== recipeId) {
        await syncShoppingListForMealPlan(existing.recipe_id, existing.id, "remove");
      }

      if (existing) {
        if (recipeId) {
          await updateMealPlan(existing.id, { recipe_id: recipeId });
          await syncShoppingListForMealPlan(recipeId, existing.id, "add");
        } else {
          await syncShoppingListForMealPlan(existing.recipe_id, existing.id, "remove");
          await deleteMealPlan(existing.id);
        }
      } else if (recipeId) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayOfWeek);
        const newPlan = await createMealPlan({
          day_of_week: dayOfWeek,
          recipe_id: recipeId,
          week_start: weekStartStr,
          plan_date: format(date, "yyyy-MM-dd"),
        });
        if (newPlan) {
          await syncShoppingListForMealPlan(recipeId, newPlan.id, "add");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal_plans"] });
      queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] });
      queryClient.invalidateQueries({ queryKey: ["meal_plan_order_status"] });
    },
  });

  const swapMeals = useMutation({
    mutationFn: async ({ fromDay, toDay }: { fromDay: number; toDay: number }) => {
      const fromPlan = mealPlans.find((mp: any) => mp.day_of_week === fromDay);
      const toPlan = mealPlans.find((mp: any) => mp.day_of_week === toDay);

      if (fromPlan && toPlan) {
        // Swap day_of_week and plan_date, keep IDs stable
        const fromDate = new Date(weekStart);
        fromDate.setDate(fromDate.getDate() + fromDay);
        const toDate = new Date(weekStart);
        toDate.setDate(toDate.getDate() + toDay);
        await updateMealPlan(fromPlan.id, { day_of_week: toDay, plan_date: format(toDate, "yyyy-MM-dd") });
        await updateMealPlan(toPlan.id, { day_of_week: fromDay, plan_date: format(fromDate, "yyyy-MM-dd") });
      } else if (fromPlan && !toPlan) {
        // Move to empty day: only update date fields, keep same ID
        const date = new Date(weekStart);
        date.setDate(date.getDate() + toDay);
        await updateMealPlan(fromPlan.id, { day_of_week: toDay, plan_date: format(date, "yyyy-MM-dd") });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal_plans"] });
      queryClient.invalidateQueries({ queryKey: ["meal_plan_order_status"] });
    },
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

  const touchDragDay = useRef<number | null>(null);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleTouchStart = useCallback((dayIndex: number, e: React.TouchEvent) => {
    const recipe = getMealForDay(dayIndex);
    if (!recipe) return;
    touchDragDay.current = dayIndex;
  }, [mealPlans]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchDragDay.current === null) return;
    const touch = e.changedTouches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    
    for (let i = 0; i < 7; i++) {
      if (dayRefs.current[i]?.contains(targetEl as Node)) {
        if (i !== touchDragDay.current) {
          swapMeals.mutate({ fromDay: touchDragDay.current, toDay: i });
        }
        break;
      }
    }
    touchDragDay.current = null;
    setDragDay(null);
  }, [swapMeals]);

  const selectRecipe = (recipeId: string) => {
    if (selectingDay !== null) {
      setMealPlan.mutate({ dayOfWeek: selectingDay, recipeId });
      setSelectingDay(null);
    }
  };

  const clearMeal = (dayIndex: number) => {
    setMealPlan.mutate({ dayOfWeek: dayIndex, recipeId: null });
  };

  const getStatusBadge = (mealPlanId: string | null) => {
    if (!mealPlanId) return null;
    const status = (mealPlanOrderStatus as Record<string, any>)[mealPlanId];
    if (!status || status.total === 0) {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap bg-muted/50">Ikke på indkøbsliste</Badge>;
    }

    if (status.ordered === status.total && status.total > 0) {
      const d = status.latestOrderedAt ? format(new Date(status.latestOrderedAt), "dd-MM-yyyy HH:mm") : "";
      return <Badge variant="default" className="text-[10px] px-1.5 py-0 whitespace-nowrap">Bestilt{d ? ` d. ${d}` : ""}</Badge>;
    }
    if (status.ordered > 0) {
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 whitespace-nowrap">{status.ordered}/{status.total} bestilt</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">På indkøbsliste</Badge>;
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
          const plan = mealPlans.find((mp: any) => mp.day_of_week === i);
          const statusBadge = getStatusBadge(plan?.id);
          const isWeekend = i >= 5; // 5=Lørdag, 6=Søndag
          return (
            <div
              key={day}
              ref={(el) => { dayRefs.current[i] = el; }}
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md select-none ${
                dragDay === i ? "opacity-50" : ""
              } ${isWeekend ? "bg-weekend border-weekend-foreground/20" : "bg-card"}`}
              style={{ touchAction: "auto", WebkitUserSelect: "none", userSelect: "none" }}
              draggable={!!recipe}
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              onTouchStart={(e) => handleTouchStart(i, e)}
              onTouchEnd={handleTouchEnd}
              onClick={() => !recipe && setSelectingDay(i)}
            >
              <div className={`px-3 py-2 text-sm font-medium text-center ${isWeekend ? "bg-weekend-foreground/10 text-weekend-foreground" : "bg-muted"}`}>
                {day}
              </div>
              {recipe ? (
                <div className="p-2 space-y-2">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-24 object-cover rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/cook/${plan?.recipe_id}`); }} />
                  ) : (
                    <div className="w-full h-24 bg-muted rounded flex items-center justify-center cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/cook/${plan?.recipe_id}`); }}>
                      <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="text-sm font-medium truncate">{recipe.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {recipe.prep_time && <span>🍳 {recipe.prep_time} min</span>}
                    {recipe.wait_time > 0 && <span className="ml-1">⏳ {recipe.wait_time} min</span>}
                  </div>
                  {statusBadge && <div>{statusBadge}</div>}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="min-h-[36px] min-w-[36px]" onClick={(e) => { e.stopPropagation(); navigate(`/cook/${plan?.recipe_id}`); }} title="Lav opskrift">
                      <CookingPot className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="min-h-[36px] min-w-[36px]" onClick={(e) => { e.stopPropagation(); setSelectingDay(i); }} title="Byt opskrift">
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
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
