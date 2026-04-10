import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShoppingListItems, addShoppingListItem, updateShoppingListItem, deleteShoppingListItem, markItemsOrdered, getProducts, getItemCategories, getOrders, createOrder, createOrderLines, getTopProductNames } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, ShoppingCart, Trash2, Pencil, Search, ChevronDown, ChevronRight, Star, Minus } from "lucide-react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { da } from "date-fns/locale";

export default function ShoppingListPage() {
  const queryClient = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [editingLine, setEditingLine] = useState<any>(null);
  const [editLineQty, setEditLineQty] = useState(1);

  const { data: items = [] } = useQuery({
    queryKey: ["shopping_list_items"],
    queryFn: () => getShoppingListItems(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["item_categories"],
    queryFn: () => getItemCategories(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products_catalog"],
    queryFn: () => getProducts(),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["top_products"],
    queryFn: () => getTopProductNames(),
  });

  const groupedByProduct = useMemo(() => {
    const map: Record<string, { product_id: string | null; product_name: string; size_label: string; unit: string; category: string; sortOrder: number; category_id: string | null; totalQty: number; price: number | null; lines: any[] }> = {};
    items.forEach((item: any) => {
      const key = item.product_id || `manual_${item.id}`;
      const catName = item.item_categories?.name || "Uden kategori";
      const sortOrder = item.item_categories?.sort_order ?? 999;
      if (!map[key]) {
        const prod = products.find((p: any) => p.id === item.product_id);
        map[key] = {
          product_id: item.product_id,
          product_name: item.product_name,
          size_label: prod?.size_label || "",
          unit: prod?.unit || "",
          category: catName,
          sortOrder,
          category_id: item.category_id,
          totalQty: 0,
          price: prod?.price ?? null,
          lines: [],
        };
      }
      map[key].totalQty += Number(item.quantity);
      map[key].lines.push(item);
    });
    return map;
  }, [items, products]);

  const groupedByCategory = useMemo(() => {
    const cats: Record<string, { category: string; sortOrder: number; productGroups: any[] }> = {};
    Object.values(groupedByProduct).forEach((pg) => {
      if (!cats[pg.category]) cats[pg.category] = { category: pg.category, sortOrder: pg.sortOrder, productGroups: [] };
      cats[pg.category].productGroups.push(pg);
    });
    return Object.values(cats).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [groupedByProduct]);

  const totalPrice = useMemo(() => {
    let total = 0;
    Object.values(groupedByProduct).forEach((pg) => {
      const hasUnchecked = pg.lines.some((l: any) => !l.is_checked);
      if (hasUnchecked && pg.price) {
        const uncheckedQty = pg.lines.filter((l: any) => !l.is_checked).reduce((sum: number, l: any) => sum + Number(l.quantity), 0);
        total += uncheckedQty * Number(pg.price);
      }
    });
    return total;
  }, [groupedByProduct]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (favoritesOnly) list = list.filter((p: any) => p.is_favorite);
    if (productSearch) {
      list = list.filter((p: any) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    } else if (!favoritesOnly) {
      if (topProducts.length > 0) {
        const topSet = new Set(topProducts);
        const top = list.filter((p: any) => topSet.has(p.name));
        if (top.length > 0) return top.slice(0, 6);
      }
      return list.slice(0, 6);
    }
    return list;
  }, [products, productSearch, favoritesOnly, topProducts]);

  const toggleCheck = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) => updateShoppingListItem(id, { is_checked: checked }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] }),
  });

  const addItemFromProduct = useMutation({
    mutationFn: ({ product, quantity }: { product: any; quantity: number }) =>
      addShoppingListItem({
        product_name: product.name,
        product_id: product.id,
        category_id: product.category_id || null,
        quantity,
        unit: product.unit || "stk",
        source_type: "manual",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] });
      setShowAddItem(false);
      setSelectedProduct(null);
      setAddQuantity(1);
      setProductSearch("");
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => deleteShoppingListItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] }),
  });

  const updateItemQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => updateShoppingListItem(id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] });
      setEditingLine(null);
    },
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      const unchecked = items.filter((i: any) => !i.is_checked);
      if (unchecked.length === 0) return;

      const aggMap: Record<string, { product_name: string; totalQty: number; unit: string; productUnit: string; category_name: string; price: number | null; size_label: string; sortOrder: number }> = {};
      unchecked.forEach((item: any) => {
        const key = item.product_id || `manual_${item.id}`;
        const prod = products.find((p: any) => p.id === item.product_id);
        const catName = item.item_categories?.name || "Uden kategori";
        const sortOrder = item.item_categories?.sort_order ?? 999;
        if (!aggMap[key]) {
          aggMap[key] = {
            product_name: item.product_name,
            totalQty: 0,
            unit: item.unit || "stk",
            productUnit: prod?.unit || "",
            category_name: catName,
            price: prod?.price ?? null,
            size_label: prod?.size_label || "",
            sortOrder,
          };
        }
        aggMap[key].totalQty += Number(item.quantity);
      });

      const aggregated = Object.values(aggMap);
      const orderTotal = aggregated.reduce((sum, a) => sum + (a.price ? a.totalQty * Number(a.price) : 0), 0);

      const doc = new jsPDF();
      doc.setFont("helvetica");
      doc.setFontSize(16);
      doc.text("Indkøbsordre", 14, 20);
      doc.setFontSize(10);
      doc.text(`Dato: ${format(new Date(), "d. MMMM yyyy, HH:mm", { locale: da })}`, 14, 28);
      doc.text(`Samlet pris: ${orderTotal.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr`, 14, 34);

      let y = 44;
      const catGroups: Record<string, typeof aggregated> = {};
      aggregated.forEach((a) => {
        if (!catGroups[a.category_name]) catGroups[a.category_name] = [];
        catGroups[a.category_name].push(a);
      });

      const printHeader = (yPos: number) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Antal", 18, yPos);
        doc.text("Vare", 40, yPos);
        doc.text("Enhedspris", 120, yPos);
        doc.text("Total", 160, yPos);
        doc.setFont("helvetica", "normal");
        return yPos + 5;
      };

      Object.entries(catGroups).sort((a, b) => {
        const sA = aggregated.find((x) => x.category_name === a[0])?.sortOrder ?? 999;
        const sB = aggregated.find((x) => x.category_name === b[0])?.sortOrder ?? 999;
        return sA - sB;
      }).forEach(([catName, catItems]) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(catName, 14, y);
        y += 6;
        y = printHeader(y);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        catItems.forEach((a) => {
          if (y > 280) { doc.addPage(); y = 20; }
          const label = `${a.product_name}${a.size_label ? " " + a.size_label : ""}${a.productUnit && a.size_label ? " " + a.productUnit : ""}`;
          const unitPrice = a.price ? `${Number(a.price).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr` : "";
          const lineTotal = a.price ? `${(a.totalQty * Number(a.price)).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr` : "";
          doc.text(`${a.totalQty}`, 18, y);
          doc.text(label, 40, y);
          if (unitPrice) doc.text(unitPrice, 120, y);
          if (lineTotal) doc.text(lineTotal, 160, y);
          y += 5;
        });
        y += 4;
      });

      const rawPdf = doc.output("datauristring");
      const pdfBase64 = rawPdf.replace(/;filename=[^;]*/, "");

      const order = await createOrder({
        status: "completed",
        total_items: aggregated.reduce((s, a) => s + a.totalQty, 0),
        total_price: orderTotal,
        pdf_data: pdfBase64,
      });

      if (!order) return;

      const lines = aggregated.map((a) => ({
        order_id: order.id,
        product_name: a.product_name,
        quantity: a.totalQty,
        unit: a.unit,
        category_name: a.category_name,
        price: a.price,
        size_label: a.size_label || null,
      }));
      await createOrderLines(lines);

      const ids = unchecked.map((i: any) => i.id);
      await markItemsOrdered(ids, order.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["shopping_list_items"] });
      queryClient.invalidateQueries({ queryKey: ["meal_plan_order_status"] });
    },
  });

  const uncheckedCount = items.filter((i: any) => !i.is_checked).length;

  const toggleExpand = (key: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const openAddItem = () => {
    setSelectedProduct(null);
    setProductSearch("");
    setAddQuantity(1);
    setFavoritesOnly(false);
    setShowAddItem(true);
  };

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    setAddQuantity(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Indkøbsliste</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Total: {totalPrice.toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr
          </span>
          <Button size="icon" onClick={openAddItem} className="min-h-[44px] min-w-[44px]">
            <Plus className="h-5 w-5" />
          </Button>
          <Button onClick={() => placeOrder.mutate()} disabled={uncheckedCount === 0} className="min-h-[44px] gap-2">
            <ShoppingCart className="h-4 w-4" /> Bestil ({uncheckedCount})
          </Button>
        </div>
      </div>

      {/* Grouped display */}
      {groupedByCategory.map((catGroup) => (
        <div key={catGroup.category} className="space-y-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">{catGroup.category}</h3>
          <div className="space-y-1">
            {catGroup.productGroups.map((pg: any) => {
              const key = pg.product_id || pg.lines[0]?.id;
              const isExpanded = expandedProducts.has(key);
              const allChecked = pg.lines.every((l: any) => l.is_checked);

              return (
                <div key={key}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${allChecked ? "bg-muted/50 opacity-60" : "bg-card"}`}
                    onClick={() => toggleExpand(key)}
                  >
                    <button className="shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${allChecked ? "line-through" : ""}`}>
                        {pg.totalQty} x {pg.product_name}{pg.size_label ? ` ${pg.size_label}` : ""}{pg.unit && pg.size_label ? ` ${pg.unit}` : ""}
                      </span>
                      {(() => {
                        const recipeLines = pg.lines.filter((l: any) => l.source_type === "recipe" && l.recipe_qty != null);
                        if (recipeLines.length > 0) {
                          const recipeInfo = recipeLines.map((l: any) => `${l.recipe_qty} ${l.recipe_unit || ""}`).join(" + ");
                          return <span className="text-xs text-muted-foreground ml-1">({recipeInfo.trim()})</span>;
                        }
                        return null;
                      })()}
                      {pg.price && (
                        <span className="text-xs text-muted-foreground ml-2">
                          á {Number(pg.price).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr
                          {pg.totalQty > 1 && `, total ${(pg.totalQty * Number(pg.price)).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr`}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="ml-8 space-y-1 mt-1">
                      {pg.lines.map((line: any) => (
                        <div key={line.id} className={`flex items-center gap-3 p-2 rounded border transition-colors ${line.is_checked ? "bg-muted/50 opacity-60" : "bg-card"}`}>
                          <Checkbox
                            checked={line.is_checked}
                            onCheckedChange={(checked) => toggleCheck.mutate({ id: line.id, checked: !!checked })}
                            className="h-4 w-4"
                          />
                          <span className={`text-sm flex-1 ${line.is_checked ? "line-through" : ""}`}>
                            {line.quantity} x {pg.product_name}{pg.size_label ? ` ${pg.size_label}` : ""}{pg.unit && pg.size_label ? ` ${pg.unit}` : ""}
                            {line.source_type === "recipe" && line.recipe_qty != null && (
                              <span className="text-xs text-muted-foreground ml-1">({line.recipe_qty} {line.recipe_unit || ""})</span>
                            )}
                          </span>
                          <Badge variant={line.source_type === "recipe" ? "secondary" : "outline"} className="text-xs">
                            {line.source_type === "recipe" ? (line.recipes?.title || "Opskrift") : "Manuel"}
                          </Badge>
                          {line.source_type === "manual" && (
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingLine(line); setEditLineQty(Number(line.quantity)); }} className="min-h-[36px] min-w-[36px]">
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteItem.mutate(line.id); }} className="min-h-[36px] min-w-[36px] text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Indkøbslisten er tom</p>
        </div>
      )}

      {/* Add item popup */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader><DialogTitle>Tilføj vare</DialogTitle></DialogHeader>
          {!selectedProduct ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Søg vare..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-10 min-h-[44px]" autoFocus />
                </div>
                <Button variant={favoritesOnly ? "default" : "outline"} size="icon" onClick={() => setFavoritesOnly(!favoritesOnly)} className="min-h-[44px] min-w-[44px]">
                  <Star className={`h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
                </Button>
              </div>
              {!productSearch && !favoritesOnly && <p className="text-xs text-muted-foreground">Mest købte varer:</p>}
              <div className="max-h-[50vh] overflow-y-auto space-y-1">
                {filteredProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors" onClick={() => selectProduct(product)}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{product.name}{product.size_label ? ` ${product.size_label}` : ""}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.item_categories?.name || "Ingen kategori"}
                        {product.price ? ` · ${Number(product.price).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr` : ""}
                      </div>
                    </div>
                    {product.is_favorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
                  </div>
                ))}
                {filteredProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Ingen varer fundet</p>}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedProduct.name}{selectedProduct.size_label ? ` ${selectedProduct.size_label}` : ""}</div>
                    <div className="text-xs text-muted-foreground">{selectedProduct.item_categories?.name || "Ingen kategori"}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="min-h-[36px]">Skift</Button>
                </div>
              </div>
              <div>
                <Label>Antal</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))} disabled={addQuantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input type="number" value={addQuantity} onChange={(e) => setAddQuantity(Math.max(1, Math.floor(Number(e.target.value))))} min={1} step={1} className="min-h-[44px] text-center flex-1" />
                  <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => setAddQuantity(addQuantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => addItemFromProduct.mutate({ product: selectedProduct, quantity: addQuantity })} className="min-h-[44px] w-full">
                  Tilføj {addQuantity} x {selectedProduct.name}{selectedProduct.size_label ? ` ${selectedProduct.size_label}` : ""}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit line quantity dialog */}
      <Dialog open={!!editingLine} onOpenChange={() => setEditingLine(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rediger antal</DialogTitle></DialogHeader>
          {editingLine && (
            <div className="space-y-3">
              <p className="text-sm">{editingLine.product_name}</p>
              <div>
                <Label>Antal</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => setEditLineQty(Math.max(1, editLineQty - 1))} disabled={editLineQty <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input type="number" value={editLineQty} onChange={(e) => setEditLineQty(Math.max(1, Math.floor(Number(e.target.value))))} min={1} step={1} className="min-h-[44px] text-center flex-1" />
                  <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => setEditLineQty(editLineQty + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => updateItemQty.mutate({ id: editingLine.id, quantity: editLineQty })} className="min-h-[44px] w-full">Gem</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
