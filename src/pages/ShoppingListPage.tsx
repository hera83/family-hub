import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, ShoppingCart, Trash2, Pencil } from "lucide-react";

export default function ShoppingListPage() {
  const queryClient = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCategoryAdmin, setShowCategoryAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newItem, setNewItem] = useState({ product_name: "", quantity: 1, unit: "stk", category_id: "", source_type: "manual" as const });
  const [newCategory, setNewCategory] = useState({ name: "", sort_order: 0 });
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["shopping_list_items"],
    queryFn: async () => {
      const { data } = await supabase.from("shopping_list_items").select("*, item_categories(name, sort_order)").order("created_at");
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["item_categories"],
    queryFn: async () => {
      const { data } = await supabase.from("item_categories").select("*").order("sort_order");
      return data || [];
    },
  });

  const groupedItems = useMemo(() => {
    const groups: Record<string, { category: string; sortOrder: number; items: any[] }> = {};
    items.forEach((item: any) => {
      const catName = item.item_categories?.name || "Uden kategori";
      const sortOrder = item.item_categories?.sort_order || 999;
      if (!groups[catName]) groups[catName] = { category: catName, sortOrder, items: [] };
      groups[catName].items.push(item);
    });
    return Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [items]);

  const toggleCheck = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      await supabase.from("shopping_list_items").update({ is_checked: checked }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] }),
  });

  const addItem = useMutation({
    mutationFn: async (item: any) => {
      await supabase.from("shopping_list_items").insert({
        ...item,
        category_id: item.category_id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] });
      setShowAddItem(false);
      setNewItem({ product_name: "", quantity: 1, unit: "stk", category_id: "", source_type: "manual" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("shopping_list_items").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] }),
  });

  const addCategory = useMutation({
    mutationFn: async (cat: { name: string; sort_order: number }) => {
      await supabase.from("item_categories").insert(cat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item_categories"] });
      setNewCategory({ name: "", sort_order: categories.length + 1 });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      await supabase.from("item_categories").update(data).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item_categories"] });
      queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] });
      setEditingCategory(null);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("item_categories").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item_categories"] });
      queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] });
    },
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      const uncheckedItems = items.filter((i: any) => !i.is_checked);
      if (uncheckedItems.length === 0) return;
      const { data: order } = await supabase.from("orders").insert({ status: "pending", total_items: uncheckedItems.length }).select().single();
      if (!order) return;
      const lines = uncheckedItems.map((item: any) => ({
        order_id: order.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        category_name: item.item_categories?.name || null,
      }));
      await supabase.from("order_lines").insert(lines);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const uncheckedCount = items.filter((i: any) => !i.is_checked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Indkøbsliste</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowCategoryAdmin(true)} className="min-h-[44px] min-w-[44px]">
            <Settings className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={() => setShowAddItem(true)} className="min-h-[44px] min-w-[44px]">
            <Plus className="h-5 w-5" />
          </Button>
          <Button onClick={() => placeOrder.mutate()} disabled={uncheckedCount === 0} className="min-h-[44px] gap-2">
            <ShoppingCart className="h-4 w-4" /> Bestil ({uncheckedCount})
          </Button>
        </div>
      </div>

      {groupedItems.map((group) => (
        <div key={group.category} className="space-y-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">{group.category}</h3>
          <div className="space-y-1">
            {group.items.map((item: any) => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${item.is_checked ? "bg-muted/50 opacity-60" : "bg-card"}`}>
                <Checkbox
                  checked={item.is_checked}
                  onCheckedChange={(checked) => toggleCheck.mutate({ id: item.id, checked: !!checked })}
                  className="h-5 w-5"
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${item.is_checked ? "line-through" : ""}`}>{item.product_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.quantity} {item.unit}</span>
                </div>
                <Badge variant={item.source_type === "recipe" ? "secondary" : "outline"} className="text-xs shrink-0">
                  {item.source_type === "recipe" ? "Opskrift" : "Manuel"}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => deleteItem.mutate(item.id)} className="min-h-[44px] min-w-[44px] text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Indkøbslisten er tom</p>
        </div>
      )}

      {/* Add item dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tilføj vare</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Varenavn</Label><Input value={newItem.product_name} onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })} placeholder="Søg eller skriv varenavn..." className="min-h-[44px]" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Antal</Label><Input type="number" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} min={1} className="min-h-[44px]" /></div>
              <div><Label>Enhed</Label>
                <select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="stk">stk</option><option value="kg">kg</option><option value="g">g</option><option value="l">l</option><option value="dl">dl</option><option value="ml">ml</option><option value="pakke">pakke</option>
                </select>
              </div>
            </div>
            <div><Label>Kategori</Label>
              <select value={newItem.category_id} onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Vælg kategori...</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => newItem.product_name && addItem.mutate(newItem)} disabled={!newItem.product_name} className="min-h-[44px]">Tilføj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category admin dialog */}
      <Dialog open={showCategoryAdmin} onOpenChange={setShowCategoryAdmin}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Administrer kategorier</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {categories.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2">
                {editingCategory?.id === c.id ? (
                  <>
                    <Input value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="flex-1 min-h-[44px]" />
                    <Button size="sm" onClick={() => updateCategory.mutate(editingCategory)} className="min-h-[44px]">Gem</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)} className="min-h-[44px]">Annuller</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingCategory({ ...c })} className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteCategory.mutate(c.id)} className="min-h-[44px] min-w-[44px] text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Input placeholder="Ny kategori..." value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="flex-1 min-h-[44px]" />
              <Button onClick={() => newCategory.name && addCategory.mutate({ ...newCategory, sort_order: categories.length + 1 })} disabled={!newCategory.name} className="min-h-[44px]">Tilføj</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
