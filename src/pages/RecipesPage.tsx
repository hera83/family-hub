import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Search, ChevronLeft, ChevronRight, UtensilsCrossed, Heart, Copy, Trash2 } from "lucide-react";

const CATEGORIES = ["Alle", "Forret", "Hovedret", "Dessert", "Pasta", "Vegetarisk", "Salat", "Suppe"];
const PAGE_SIZE = 10;

const emptyRecipe = {
  title: "", image_url: "", description: "", category: "Hovedret", prep_time: 30,
  instructions: "", is_manual: true, is_favorite: false,
};

export default function RecipesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle");
  const [page, setPage] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [formData, setFormData] = useState(emptyRecipe);

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

  const recipes = recipesData?.recipes || [];
  const totalPages = Math.ceil((recipesData?.total || 0) / PAGE_SIZE);

  const isNew = (createdAt: string) => {
    const d = new Date(createdAt);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) < 7;
  };

  const saveRecipe = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        await supabase.from("recipes").update(rest).eq("id", id);
      } else {
        await supabase.from("recipes").insert(data);
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
    setShowEditor(true);
  };

  const openEdit = (recipe: any) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title, image_url: recipe.image_url || "", description: recipe.description || "",
      category: recipe.category || "Hovedret", prep_time: recipe.prep_time || 30,
      instructions: recipe.instructions || "", is_manual: recipe.is_manual, is_favorite: recipe.is_favorite,
    });
    setShowEditor(true);
  };

  const cloneRecipe = (recipe: any) => {
    setEditingRecipe(null);
    setFormData({
      title: `${recipe.title} (kopi)`, image_url: recipe.image_url || "", description: recipe.description || "",
      category: recipe.category || "Hovedret", prep_time: recipe.prep_time || 30,
      instructions: recipe.instructions || "", is_manual: true, is_favorite: false,
    });
    setShowEditor(true);
  };

  const updateField = (field: string, value: any) => setFormData((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Opskrifter</h2>
        <Button onClick={openNew} className="min-h-[44px] gap-2">
          <Plus className="h-4 w-4" /> Ny opskrift
        </Button>
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
        {CATEGORIES.map((cat) => (
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

      {/* Recipe editor dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRecipe ? "Rediger opskrift" : "Ny opskrift"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titel</Label><Input value={formData.title} onChange={(e) => updateField("title", e.target.value)} className="min-h-[44px]" /></div>
            <div><Label>Billede URL</Label><Input value={formData.image_url} onChange={(e) => updateField("image_url", e.target.value)} placeholder="https://..." className="min-h-[44px]" /></div>
            <div><Label>Beskrivelse</Label><textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Kategori</Label>
                <select value={formData.category} onChange={(e) => updateField("category", e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {CATEGORIES.filter((c) => c !== "Alle").map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>Tilberedningstid (min)</Label><Input type="number" value={formData.prep_time} onChange={(e) => updateField("prep_time", Number(e.target.value))} className="min-h-[44px]" /></div>
            </div>
            <div><Label>Fremgangsmåde</Label><textarea value={formData.instructions} onChange={(e) => updateField("instructions", e.target.value)} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]" /></div>
          </div>
          <DialogFooter className="gap-2">
            {editingRecipe && (
              <Button variant="destructive" onClick={() => { deleteRecipe.mutate(editingRecipe.id); setShowEditor(false); }} className="min-h-[44px]">Slet</Button>
            )}
            <Button
              onClick={() => {
                const payload = { ...formData, prep_time: formData.prep_time || null, image_url: formData.image_url || null };
                if (editingRecipe) (payload as any).id = editingRecipe.id;
                saveRecipe.mutate(payload);
              }}
              disabled={!formData.title}
              className="min-h-[44px]"
            >
              {editingRecipe ? "Gem" : "Opret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
