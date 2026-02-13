import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, ShoppingCart, Trash2, Pencil, Search } from "lucide-react";

const UNITS = ["stk", "kg", "g", "l", "dl", "ml", "pakke", "spsk", "tsk", "dåse"];

export default function ShoppingListPage() {
  const queryClient = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCategoryAdmin, setShowCategoryAdmin] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [addUnit, setAddUnit] = useState("stk");
  const [newProduct, setNewProduct] = useState({ name: "", unit: "stk", category_id: "" });
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

  const { data: products = [] } = useQuery({
    queryKey: ["products_catalog"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, item_categories(name)").order("name");
      return data || [];
    },
  });

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter((p: any) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

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

  const addItemFromProduct = useMutation({
    mutationFn: async ({ product, quantity, unit }: { product: any; quantity: number; unit: string }) => {
      await supabase.from("shopping_list_items").insert({
        product_name: product.name,
        product_id: product.id,
        category_id: product.category_id || null,
        quantity,
        unit,
        source_type: "manual",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] });
      setShowAddItem(false);
      setSelectedProduct(null);
      setAddQuantity(1);
      setAddUnit("stk");
      setProductSearch("");
    },
  });

  const createProduct = useMutation({
    mutationFn: async (product: { name: string; unit: string; category_id: string }) => {
      const { data } = await supabase.from("products").insert({
        name: product.name,
        unit: product.unit,
        category_id: product.category_id || null,
        is_manual: true,
      }).select("*, item_categories(name)").single();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products_catalog"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowCreateProduct(false);
      setNewProduct({ name: "", unit: "stk", category_id: "" });
      if (data) {
        setSelectedProduct(data);
        setAddUnit(data.unit || "stk");
      }
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

  const openAddItem = () => {
    setSelectedProduct(null);
    setProductSearch("");
    setAddQuantity(1);
    setAddUnit("stk");
    setShowAddItem(true);
  };

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    setAddUnit(product.unit || "stk");
    setAddQuantity(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Indkøbsliste</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowCategoryAdmin(true)} className="min-h-[44px] min-w-[44px]">
            <Settings className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={openAddItem} className="min-h-[44px] min-w-[44px]">
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

      {/* Product catalog search dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader><DialogTitle>Tilføj vare fra katalog</DialogTitle></DialogHeader>

          {!selectedProduct ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søg i varekatalog..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10 min-h-[44px]"
                  autoFocus
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto space-y-1">
                {filteredProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => selectProduct(product)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.item_categories?.name || "Ingen kategori"} · {product.unit || "stk"}
                      </div>
                    </div>
                    <Badge variant={product.is_manual ? "outline" : "secondary"} className="text-xs shrink-0">
                      {product.is_manual ? "Manuel" : "API"}
                    </Badge>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Ingen produkter fundet</p>
                )}
              </div>
              <Button variant="outline" onClick={() => setShowCreateProduct(true)} className="w-full min-h-[44px] gap-2">
                <Plus className="h-4 w-4" /> Opret ny vare
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedProduct.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedProduct.item_categories?.name || "Ingen kategori"}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="min-h-[36px]">Skift</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Antal</Label><Input type="number" value={addQuantity} onChange={(e) => setAddQuantity(Number(e.target.value))} min={0.1} step={0.1} className="min-h-[44px]" /></div>
                <div><Label>Enhed</Label>
                  <select value={addUnit} onChange={(e) => setAddUnit(e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => addItemFromProduct.mutate({ product: selectedProduct, quantity: addQuantity, unit: addUnit })} className="min-h-[44px] w-full">Tilføj til indkøbsliste</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create new product dialog */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Opret ny vare</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Varenavn</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Navn..." className="min-h-[44px]" autoFocus /></div>
            <div><Label>Enhed</Label>
              <select value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><Label>Kategori</Label>
              <select value={newProduct.category_id} onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Vælg kategori...</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => newProduct.name && createProduct.mutate(newProduct)} disabled={!newProduct.name} className="min-h-[44px]">Opret vare</Button>
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
