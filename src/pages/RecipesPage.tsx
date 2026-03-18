import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";
import { Plus, Pencil, Search, ChevronLeft, ChevronRight, UtensilsCrossed, Heart, Copy, Trash2, X, Settings } from "lucide-react";

const PAGE_SIZE = 10;
const UNITS = ["stk", "kg", "g", "l", "dl", "ml", "pakke", "spsk", "tsk", "dåse"];

const emptyRecipe = {
  title: "", image_url: "", description: "", category: "Hovedret", prep_time: 30 as number | string, wait_time: 0 as number | string,
  instructions: "", is_manual: true, is_favorite: false,
};

let clientIdCounter = 0;
function nextClientId() {
  return `_client_${++clientIdCounter}_${Date.now()}`;
}

type IngredientRow = {
  id?: string;
  client_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number | string;
  unit: string;
  is_staple: boolean;
  _deleted?: boolean;
};

export default function RecipesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [page, setPage] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [formData, setFormData] = useState(emptyRecipe);
  const [showAdmin, setShowAdmin] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string; value: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);

  // Ingredients state
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Categories from DB
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["recipe_categories"],
    queryFn: async () => {
      const { data } = await supabase.from("recipe_categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const categories = useMemo(() => {
    return ["Alle", ...dbCategories.map((c: any) => c.name)];
  }, [dbCategories]);


  const { data: recipesData } = useQuery({
    queryKey: ["recipes_paginated", searchQuery, categoryFilter, page],
    queryFn: async () => {
      let query = supabase.from("recipes").select("*", { count: "exact" });
      if (categoryFilter !== "Alle") query = query.eq("category", categoryFilter);
      if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
      const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      return { recipes: data || [], total: count || 0 };
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, item_categories(name)").order("name");
      return data || [];
    },
  });

  const filteredProducts = useMemo(() => {
    if (!ingredientSearch) return products;
    return products.filter((p: any) => p.name.toLowerCase().includes(ingredientSearch.toLowerCase()));
  }, [products, ingredientSearch]);

  useEffect(() => {
    if (showEditor && editingRecipe?.id) {
      supabase
        .from("recipe_ingredients")
        .select("*, products(name)")
        .eq("recipe_id", editingRecipe.id)
        .then(({ data }) => {
        setIngredients(
            (data || []).map((ing: any) => ({
              id: ing.id,
              client_id: nextClientId(),
              product_id: ing.product_id,
              product_name: ing.products?.name || ing.name || "",
              quantity: ing.quantity,
              unit: ing.unit || "stk",
              is_staple: ing.is_staple || false,
            }))
          );
        });
    } else if (showEditor && !editingRecipe) {
      setIngredients([]);
    }
  }, [showEditor, editingRecipe]);

  const recipes = recipesData?.recipes || [];
  const totalPages = Math.ceil((recipesData?.total || 0) / PAGE_SIZE);

  const isNew = (createdAt: string) => {
    const d = new Date(createdAt);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) < 7;
  };

  const saveRecipe = useMutation({
    mutationFn: async (data: any) => {
      let recipeId: string;
      if (data.id) {
        const { id, ...rest } = data;
        await supabase.from("recipes").update(rest).eq("id", id);
        recipeId = id;
      } else {
        const { data: inserted } = await supabase.from("recipes").insert(data).select("id").single();
        recipeId = inserted!.id;
      }

      const existing = ingredients.filter((i) => i.id && !i._deleted);
      const toDelete = ingredients.filter((i) => i.id && i._deleted);
      const toInsert = ingredients.filter((i) => !i.id && !i._deleted);

      if (toDelete.length > 0) {
        await supabase.from("recipe_ingredients").delete().in("id", toDelete.map((i) => i.id!));
      }

      for (const ing of existing) {
        await supabase.from("recipe_ingredients").update({
          product_id: ing.product_id,
          name: ing.product_name,
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit,
          is_staple: ing.is_staple,
        }).eq("id", ing.id!);
      }

      if (toInsert.length > 0) {
        await supabase.from("recipe_ingredients").insert(
          toInsert.map((ing) => ({
            recipe_id: recipeId,
            product_id: ing.product_id,
            name: ing.product_name,
            quantity: Number(ing.quantity) || 1,
            unit: ing.unit,
            is_staple: ing.is_staple,
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setShowEditor(false);
    },
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
      await supabase.from("recipes").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      await supabase.from("recipes").update({ is_favorite }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes_paginated"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const openNew = () => {
    setEditingRecipe(null);
    setFormData({ ...emptyRecipe });
    setIngredients([]);
    setShowEditor(true);
  };

  const openEdit = (recipe: any) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title, image_url: recipe.image_url || "", description: recipe.description || "",
      category: recipe.category || "Hovedret", prep_time: recipe.prep_time || 30,
      wait_time: recipe.wait_time || 0,
      instructions: recipe.instructions || "", is_manual: recipe.is_manual, is_favorite: recipe.is_favorite,
    });
    setShowEditor(true);
  };

  const cloneRecipe = async (recipe: any) => {
    const { data: srcIngredients } = await supabase
      .from("recipe_ingredients")
      .select("*, products(name)")
      .eq("recipe_id", recipe.id);

    setEditingRecipe(null);
    setFormData({
      title: `${recipe.title} (kopi)`, image_url: recipe.image_url || "", description: recipe.description || "",
      category: recipe.category || "Hovedret", prep_time: recipe.prep_time || 30,
      wait_time: recipe.wait_time || 0,
      instructions: recipe.instructions || "", is_manual: true, is_favorite: false,
    });
    setIngredients(
      (srcIngredients || []).map((ing: any) => ({
        client_id: nextClientId(),
        product_id: ing.product_id,
        product_name: ing.products?.name || ing.name || "",
        quantity: ing.quantity,
        unit: ing.unit || "stk",
        is_staple: ing.is_staple || false,
      }))
    );
    setShowEditor(true);
  };

  const updateField = (field: string, value: any) => setFormData((f) => ({ ...f, [field]: value }));

  const addIngredientFromProduct = (product: any) => {
    setIngredients((prev) => {
      const existingIdx = prev.findIndex((i) => i.product_id === product.id && !i._deleted);
      if (existingIdx !== -1) {
        return prev.map((ing, i) => i === existingIdx ? { ...ing, quantity: Number(ing.quantity) + 1 } : ing);
      }
      return [
        ...prev,
        { client_id: nextClientId(), product_id: product.id, product_name: product.name, quantity: 1, unit: product.unit || "stk", is_staple: false },
      ];
    });
    setIngredientSearch("");
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)));
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => {
      const ing = prev[index];
      if (!ing) return prev;
      if (!ing.id) {
        // New ingredient – remove from state entirely
        return prev.filter((_, i) => i !== index);
      }
      // Existing in DB – mark deleted
      return prev.map((item, i) => i === index ? { ...item, _deleted: true } : item);
    });
  };

  const activeIngredients = ingredients.filter((i) => !i._deleted);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Opskrifter</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowAdmin(true)} className="min-h-[44px] min-w-[44px]">
            <Settings className="h-5 w-5" />
          </Button>
          <Button onClick={openNew} className="min-h-[44px] gap-2">
            <Plus className="h-4 w-4" /> Ny opskrift
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søg opskrifter..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="pl-10 min-h-[44px]"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button key={cat} variant={categoryFilter === cat ? "default" : "outline"} size="sm" onClick={() => { setCategoryFilter(cat); setPage(1); }} className="min-h-[36px]">
            {cat}
          </Button>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {recipes.map((recipe: any) => (
          <div key={recipe.id} className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
            {recipe.image_url ? (
              <img src={recipe.image_url} alt={recipe.title} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-muted flex items-center justify-center">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm leading-tight">{recipe.title}</h3>
                <div className="flex gap-1 shrink-0">
                  {isNew(recipe.created_at) && <Badge className="text-xs">Ny</Badge>}
                  {!recipe.is_manual && <Badge variant="secondary" className="text-xs">API</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{recipe.category}</span>
                {recipe.prep_time && <span>· {recipe.prep_time} min</span>}
                {recipe.wait_time > 0 && <span>· ventetid {recipe.wait_time} min</span>}
              </div>
              <div className="flex items-center gap-1 pt-1">
                <Button size="icon" variant="ghost" onClick={() => toggleFavorite.mutate({ id: recipe.id, is_favorite: !recipe.is_favorite })} className="min-h-[36px] min-w-[36px]">
                  <Heart className={`h-4 w-4 ${recipe.is_favorite ? "fill-current text-destructive" : ""}`} />
                </Button>
                {recipe.is_manual ? (
                  <Button size="icon" variant="ghost" onClick={() => openEdit(recipe)} className="min-h-[36px] min-w-[36px]"><Pencil className="h-4 w-4" /></Button>
                ) : (
                  <Button size="icon" variant="ghost" onClick={() => cloneRecipe(recipe)} className="min-h-[36px] min-w-[36px]"><Copy className="h-4 w-4" /></Button>
                )}
                {recipe.is_manual && (
                  <Button size="icon" variant="ghost" onClick={() => deleteRecipe.mutate(recipe.id)} className="min-h-[36px] min-w-[36px] text-destructive"><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {recipes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Ingen opskrifter fundet</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)} className="min-h-[44px] min-w-[44px]">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">Side {page} af {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="min-h-[44px] min-w-[44px]">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Category admin dialog */}
      <Dialog open={showAdmin} onOpenChange={setShowAdmin}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Kategorier</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {dbCategories.map((cat: any) => (
              <div key={cat.id} className="flex items-center gap-2">
                {editingCategory?.id === cat.id ? (
                  <>
                    <Input
                      value={editingCategory.value}
                      onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
                      className="flex-1 min-h-[44px]"
                    />
                    <Button size="sm" onClick={async () => {
                      if (editingCategory.value && editingCategory.value !== cat.name) {
                        await supabase.from("recipe_categories").update({ name: editingCategory.value }).eq("id", cat.id);
                        await supabase.from("recipes").update({ category: editingCategory.value }).eq("category", cat.name);
                        queryClient.invalidateQueries({ queryKey: ["recipe_categories"] });
                        queryClient.invalidateQueries({ queryKey: ["recipes_paginated"] });
                      }
                      setEditingCategory(null);
                    }} className="min-h-[44px]">Gem</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)} className="min-h-[44px]">Annuller</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{cat.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingCategory({ id: cat.id, value: cat.name })} className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeletingCategory({ id: cat.id, name: cat.name })} className="min-h-[44px] min-w-[44px] text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Input
                placeholder="Ny kategori..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 min-h-[44px]"
              />
              <Button
                onClick={async () => {
                  if (newCategory.trim()) {
                    const maxOrder = dbCategories.length > 0 ? Math.max(...dbCategories.map((c: any) => c.sort_order)) : 0;
                    await supabase.from("recipe_categories").insert({ name: newCategory.trim(), sort_order: maxOrder + 1 });
                    queryClient.invalidateQueries({ queryKey: ["recipe_categories"] });
                    setNewCategory("");
                  }
                }}
                disabled={!newCategory.trim()}
                className="min-h-[44px]"
              >
                Tilføj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete category confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette kategorien "{deletingCategory?.name}"? Opskrifter med denne kategori vil blive sat til "Ukategoriseret".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Annuller</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px]" onClick={async () => {
              if (!deletingCategory) return;
              await supabase.from("recipes").update({ category: null }).eq("category", deletingCategory.name);
              await supabase.from("recipe_categories").delete().eq("id", deletingCategory.id);
              queryClient.invalidateQueries({ queryKey: ["recipe_categories"] });
              queryClient.invalidateQueries({ queryKey: ["recipes_paginated"] });
              setDeletingCategory(null);
            }}>Slet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRecipe ? "Rediger opskrift" : "Ny opskrift"}</DialogTitle></DialogHeader>

          {showProductSearch ? (
            /* Inline product search - replaces dialog content temporarily */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowProductSearch(false)} className="min-h-[36px] gap-1 shrink-0">
                  <ChevronLeft className="h-4 w-4" /> Tilbage
                </Button>
                <span className="text-sm font-medium">Vælg produkt</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søg i varekatalog..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="pl-10 min-h-[44px]"
                  autoFocus
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-1">
                {filteredProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => addIngredientFromProduct(product)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.item_categories?.name || "Ingen kategori"} · {product.unit || "stk"}</div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Ingen produkter fundet</p>
                )}
              </div>
            </div>
          ) : (
            /* Normal recipe editor form */
            <>
              <div className="space-y-3">
                <div><Label>Titel</Label><Input value={formData.title} onChange={(e) => updateField("title", e.target.value)} className="min-h-[44px]" /></div>
                <div><Label>Billede</Label><ImageUpload value={formData.image_url || null} onChange={(url) => updateField("image_url", url || "")} folder="recipes" /></div>
                <div>
                  <Label>Kategori</Label>
                  <select value={formData.category} onChange={(e) => updateField("category", e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {categories.filter((c) => c !== "Alle").map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
              <div><Label>Køkkentid (min)</Label><Input type="number" value={formData.prep_time} onChange={(e) => updateField("prep_time", e.target.value === "" ? "" : e.target.value)} onBlur={() => updateField("prep_time", formData.prep_time === "" ? 0 : Number(formData.prep_time))} className="min-h-[44px]" /></div>
                  <div><Label>Ventetid (min)</Label><Input type="number" value={formData.wait_time} onChange={(e) => updateField("wait_time", e.target.value === "" ? "" : e.target.value)} onBlur={() => updateField("wait_time", formData.wait_time === "" ? 0 : Number(formData.wait_time))} className="min-h-[44px]" /></div>
                </div>
                <div>
                  <Label>Fremgangsmåde</Label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => updateField("instructions", e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]"
                  />
                </div>

                {/* Ingredients section */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Ingredienser</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => { setShowProductSearch(true); setIngredientSearch(""); }} className="min-h-[36px] gap-1">
                      <Plus className="h-3 w-3" /> Tilføj ingrediens
                    </Button>
                  </div>

                  {activeIngredients.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">Ingen ingredienser tilføjet endnu</p>
                  )}

                  {activeIngredients.map((ing) => {
                    const realIndex = ingredients.findIndex((i) => i === ing);
                    return (
                      <div key={ing.id ?? ing.client_id} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Checkbox
                            checked={ing.is_staple}
                            onCheckedChange={(checked) => updateIngredient(realIndex, "is_staple", !!checked)}
                            className="h-4 w-4"
                            title="Basisvare (tilføjes ikke til indkøbslisten)"
                          />
                          <span className={`text-sm truncate ${ing.is_staple ? "text-muted-foreground italic" : ""}`}>
                            {ing.product_name}
                            {ing.is_staple && <span className="text-xs ml-1">(basis)</span>}
                          </span>
                        </div>
                        <Input
                          type="number"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(realIndex, "quantity", e.target.value === "" ? "" : e.target.value)}
                          onBlur={() => updateIngredient(realIndex, "quantity", ing.quantity === "" ? 1 : Number(ing.quantity))}
                          className="w-20 min-h-[36px]"
                          min={0.1}
                          step={0.1}
                        />
                        <select
                          value={ing.unit}
                          onChange={(e) => updateIngredient(realIndex, "unit", e.target.value)}
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <Button size="icon" variant="ghost" onClick={() => removeIngredient(realIndex)} className="min-h-[36px] min-w-[36px] text-destructive shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Switch checked={formData.is_favorite} onCheckedChange={(v) => updateField("is_favorite", v)} />
                  <Label>Favorit</Label>
                </div>
              </div>
              <DialogFooter className="gap-2">
                {editingRecipe && (
                  <Button variant="destructive" onClick={() => { deleteRecipe.mutate(editingRecipe.id); setShowEditor(false); }} className="min-h-[44px]">Slet</Button>
                )}
                <Button
                  onClick={() => {
                    const payload = {
                      ...formData,
                      prep_time: formData.prep_time === "" ? null : (Number(formData.prep_time) || null),
                      wait_time: formData.wait_time === "" ? null : (Number(formData.wait_time) || null),
                      image_url: formData.image_url || null,
                    };
                    if (editingRecipe) (payload as any).id = editingRecipe.id;
                    saveRecipe.mutate(payload);
                  }}
                  disabled={!formData.title}
                  className="min-h-[44px]"
                >
                  {editingRecipe ? "Gem" : "Opret"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
