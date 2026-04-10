import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Star } from "lucide-react";
import { DataImportExport } from "@/components/DataImportExport";
import {
  getItemCategories, createItemCategory, updateItemCategory, deleteItemCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  getRecipeCategories, createRecipeCategory, updateRecipeCategory, deleteRecipeCategory,
  renameRecipeCategoryOnRecipes, clearRecipeCategoryOnRecipes,
  getFamilyMembers, createFamilyMember, updateFamilyMember, deleteFamilyMember,
} from "@/lib/api";

const UNITS = ["stk", "kg", "g", "l", "dl", "ml", "pakke", "spsk", "tsk", "dåse"];

const MUTED_COLORS = [
  "hsl(210, 30%, 65%)", "hsl(340, 25%, 65%)", "hsl(160, 25%, 55%)",
  "hsl(30, 35%, 60%)", "hsl(270, 20%, 65%)", "hsl(190, 30%, 55%)",
];

function ProductForm({ values, onChange, categories }: { values: any; onChange: (v: any) => void; categories: any[] }) {
  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      <div><Label>Varenavn *</Label><Input value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} className="min-h-[44px]" /></div>
      <div><Label>Billede</Label><ImageUpload value={values.image_url || null} onChange={(url) => onChange({ ...values, image_url: url || "" })} folder="products" /></div>
      <div><Label>Beskrivelse</Label><Input value={values.description || ""} onChange={(e) => onChange({ ...values, description: e.target.value })} className="min-h-[44px]" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Enhed</Label>
          <select value={values.unit} onChange={(e) => onChange({ ...values, unit: e.target.value })} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div><Label>Mængde (f.eks. 1 L)</Label><Input value={values.size_label || ""} onChange={(e) => onChange({ ...values, size_label: e.target.value })} className="min-h-[44px]" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Pris (kr)</Label><Input value={values.price ?? ""} onChange={(e) => onChange({ ...values, price: e.target.value })} placeholder="11,95" className="min-h-[44px]" /></div>
        <div><Label>Kategori</Label>
          <select value={values.category_id || ""} onChange={(e) => onChange({ ...values, category_id: e.target.value })} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Vælg...</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={values.is_favorite || false} onCheckedChange={(v) => onChange({ ...values, is_favorite: v })} />
          <Label>Favoritvare</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={values.is_staple || false} onCheckedChange={(v) => onChange({ ...values, is_staple: v })} />
          <Label>Basisvare</Label>
        </div>
      </div>
      <div className="border-t pt-3">
        <Label className="text-muted-foreground">Næringsindhold pr. 100g (valgfrit)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div><Label className="text-xs">Kalorier</Label><Input type="number" value={values.calories_per_100g ?? ""} onChange={(e) => onChange({ ...values, calories_per_100g: e.target.value })} className="min-h-[40px]" /></div>
          <div><Label className="text-xs">Fedt (g)</Label><Input type="number" value={values.fat_per_100g ?? ""} onChange={(e) => onChange({ ...values, fat_per_100g: e.target.value })} className="min-h-[40px]" /></div>
          <div><Label className="text-xs">Kulhydrater (g)</Label><Input type="number" value={values.carbs_per_100g ?? ""} onChange={(e) => onChange({ ...values, carbs_per_100g: e.target.value })} className="min-h-[40px]" /></div>
          <div><Label className="text-xs">Protein (g)</Label><Input type="number" value={values.protein_per_100g ?? ""} onChange={(e) => onChange({ ...values, protein_per_100g: e.target.value })} className="min-h-[40px]" /></div>
          <div><Label className="text-xs">Fibre (g)</Label><Input type="number" value={values.fiber_per_100g ?? ""} onChange={(e) => onChange({ ...values, fiber_per_100g: e.target.value })} className="min-h-[40px]" /></div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Item categories state
  const [categorySearch, setCategorySearch] = useState("");
  const [newCategory, setNewCategory] = useState({ name: "", sort_order: 0 });
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Products state
  const [productSearch, setProductSearch] = useState("");
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: "", unit: "stk", category_id: "", description: "", size_label: "",
    price: "", image_url: "", is_favorite: false, is_staple: false,
    calories_per_100g: "", fat_per_100g: "", carbs_per_100g: "", protein_per_100g: "", fiber_per_100g: "",
  });

  // Recipe categories state
  const [recipeCatSearch, setRecipeCatSearch] = useState("");
  const [newRecipeCat, setNewRecipeCat] = useState("");
  const [editingRecipeCat, setEditingRecipeCat] = useState<{ id: string; value: string } | null>(null);
  const [deletingRecipeCat, setDeletingRecipeCat] = useState<{ id: string; name: string } | null>(null);

  // Family members state
  const [newMember, setNewMember] = useState({ name: "", color: MUTED_COLORS[0] });
  const [editingMember, setEditingMember] = useState<any>(null);

  // Queries
  const { data: itemCategories = [] } = useQuery({ queryKey: ["item_categories"], queryFn: getItemCategories });
  const { data: products = [] } = useQuery({ queryKey: ["products_catalog"], queryFn: getProducts });
  const { data: recipeCategories = [] } = useQuery({ queryKey: ["recipe_categories"], queryFn: getRecipeCategories });
  const { data: members = [] } = useQuery({ queryKey: ["family_members"], queryFn: getFamilyMembers });

  // === Item Categories mutations ===
  const addItemCat = useMutation({
    mutationFn: (cat: { name: string; sort_order: number }) => createItemCategory(cat),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["item_categories"] }); setNewCategory({ name: "", sort_order: itemCategories.length + 1 }); },
  });
  const updateItemCat = useMutation({
    mutationFn: async ({ id, ...data }: any) => updateItemCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["item_categories"] }); setEditingCategory(null); },
  });
  const deleteItemCat = useMutation({
    mutationFn: (id: string) => deleteItemCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["item_categories"] }); },
  });

  // === Products mutations ===
  const createProductMut = useMutation({
    mutationFn: async (product: any) => createProduct({
      name: product.name, unit: product.unit, category_id: product.category_id || null, is_manual: true,
      description: product.description || null, size_label: product.size_label || null,
      price: product.price ? parseFloat(product.price.toString().replace(",", ".")) : null,
      image_url: product.image_url || null, is_favorite: product.is_favorite || false, is_staple: product.is_staple || false,
      calories_per_100g: product.calories_per_100g ? parseFloat(product.calories_per_100g) : null,
      fat_per_100g: product.fat_per_100g ? parseFloat(product.fat_per_100g) : null,
      carbs_per_100g: product.carbs_per_100g ? parseFloat(product.carbs_per_100g) : null,
      protein_per_100g: product.protein_per_100g ? parseFloat(product.protein_per_100g) : null,
      fiber_per_100g: product.fiber_per_100g ? parseFloat(product.fiber_per_100g) : null,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products_catalog"] }); setShowCreateProduct(false); resetNewProduct(); },
  });
  const updateProductMut = useMutation({
    mutationFn: async (product: any) => {
      const { id, item_categories, ...rest } = product;
      await updateProduct(id, {
        ...rest,
        price: rest.price ? parseFloat(rest.price.toString().replace(",", ".")) : null,
        calories_per_100g: rest.calories_per_100g ? parseFloat(rest.calories_per_100g) : null,
        fat_per_100g: rest.fat_per_100g ? parseFloat(rest.fat_per_100g) : null,
        carbs_per_100g: rest.carbs_per_100g ? parseFloat(rest.carbs_per_100g) : null,
        protein_per_100g: rest.protein_per_100g ? parseFloat(rest.protein_per_100g) : null,
        fiber_per_100g: rest.fiber_per_100g ? parseFloat(rest.fiber_per_100g) : null,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products_catalog"] }); setEditingProduct(null); },
  });
  const deleteProductMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products_catalog"] }),
  });

  // === Family members mutations ===
  const addMemberMut = useMutation({
    mutationFn: (m: { name: string; color: string }) => createFamilyMember(m),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["family_members"] }); setNewMember({ name: "", color: MUTED_COLORS[members.length % MUTED_COLORS.length] }); },
  });
  const updateMemberMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => updateFamilyMember(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["family_members"] }); setEditingMember(null); },
  });
  const deleteMemberMut = useMutation({
    mutationFn: (id: string) => deleteFamilyMember(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family_members"] }),
  });

  const resetNewProduct = () => setNewProduct({
    name: "", unit: "stk", category_id: "", description: "", size_label: "",
    price: "", image_url: "", is_favorite: false, is_staple: false,
    calories_per_100g: "", fat_per_100g: "", carbs_per_100g: "", protein_per_100g: "", fiber_per_100g: "",
  });

  const filteredItemCategories = useMemo(() => {
    if (!categorySearch) return itemCategories;
    return itemCategories.filter((c: any) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [itemCategories, categorySearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter((p: any) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const filteredRecipeCategories = useMemo(() => {
    if (!recipeCatSearch) return recipeCategories;
    return recipeCategories.filter((c: any) => c.name.toLowerCase().includes(recipeCatSearch.toLowerCase()));
  }, [recipeCategories, recipeCatSearch]);

  const [activeTab, setActiveTab] = useState("item-categories");

  const leftTabs = [
    { value: "item-categories", label: "Varekategorier" },
    { value: "products", label: "Varer" },
    { value: "recipe-categories", label: "Opskriftkategorier" },
    { value: "family-members", label: "Familiemedlemmer" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Indstillinger</h2>

      <div className="flex gap-1 border-b border-border mb-4">
        {leftTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative min-h-[44px] rounded-t-lg ${
              activeTab === tab.value
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setActiveTab("data")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative min-h-[44px] rounded-t-lg ${
            activeTab === "data"
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Data
          {activeTab === "data" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "data" ? (
        <DataImportExport />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        {/* === Item Categories === */}
        <TabsContent value="item-categories" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg kategori..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="pl-10 min-h-[44px]" />
          </div>
          <div className="space-y-2">
            {filteredItemCategories.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                {editingCategory?.id === c.id ? (
                  <>
                    <Input value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="flex-1 min-h-[44px]" />
                    <Button size="sm" onClick={() => updateItemCat.mutate(editingCategory)} className="min-h-[44px]">Gem</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)} className="min-h-[44px]">Annuller</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingCategory({ ...c })} className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteItemCat.mutate(c.id)} className="min-h-[44px] min-w-[44px] text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input placeholder="Ny kategori..." value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="flex-1 min-h-[44px]" />
            <Button onClick={() => newCategory.name && addItemCat.mutate({ ...newCategory, sort_order: itemCategories.length + 1 })} disabled={!newCategory.name} className="min-h-[44px]">Tilføj</Button>
          </div>
        </TabsContent>

        {/* === Products === */}
        <TabsContent value="products" className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Søg vare..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-10 min-h-[44px]" />
            </div>
            <Button onClick={() => { resetNewProduct(); setShowCreateProduct(true); }} className="min-h-[44px] gap-2">
              <Plus className="h-4 w-4" /> Opret vare
            </Button>
          </div>
          <div className="space-y-2">
            {filteredProducts.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}{p.size_label ? ` ${p.size_label}` : ""}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.item_categories?.name || "Ingen kategori"}
                    {p.price ? ` · ${Number(p.price).toLocaleString("da-DK", { minimumFractionDigits: 2 })} kr` : ""}
                  </div>
                </div>
                {p.is_favorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
                {p.is_staple && <Badge variant="secondary" className="text-xs shrink-0">Basis</Badge>}
                <Badge variant={p.is_manual ? "outline" : "secondary"} className="text-xs shrink-0">{p.is_manual ? "Manuel" : "API"}</Badge>
                {p.is_manual && (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => setEditingProduct({ ...p })} className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteProductMut.mutate(p.id)} className="min-h-[44px] min-w-[44px] text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* === Recipe Categories === */}
        <TabsContent value="recipe-categories" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg kategori..." value={recipeCatSearch} onChange={(e) => setRecipeCatSearch(e.target.value)} className="pl-10 min-h-[44px]" />
          </div>
          <div className="space-y-2">
            {filteredRecipeCategories.map((cat: any) => (
              <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                {editingRecipeCat?.id === cat.id ? (
                  <>
                    <Input value={editingRecipeCat.value} onChange={(e) => setEditingRecipeCat({ ...editingRecipeCat, value: e.target.value })} className="flex-1 min-h-[44px]" />
                    <Button size="sm" onClick={async () => {
                      if (editingRecipeCat.value && editingRecipeCat.value !== cat.name) {
                        await updateRecipeCategory(cat.id, { name: editingRecipeCat.value });
                        await renameRecipeCategoryOnRecipes(cat.name, editingRecipeCat.value);
                        queryClient.invalidateQueries({ queryKey: ["recipe_categories"] });
                        queryClient.invalidateQueries({ queryKey: ["recipes_paginated"] });
                      }
                      setEditingRecipeCat(null);
                    }} className="min-h-[44px]">Gem</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingRecipeCat(null)} className="min-h-[44px]">Annuller</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{cat.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingRecipeCat({ id: cat.id, value: cat.name })} className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeletingRecipeCat({ id: cat.id, name: cat.name })} className="min-h-[44px] min-w-[44px] text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input placeholder="Ny kategori..." value={newRecipeCat} onChange={(e) => setNewRecipeCat(e.target.value)} className="flex-1 min-h-[44px]" />
            <Button onClick={async () => {
              if (newRecipeCat.trim()) {
                const maxOrder = recipeCategories.length > 0 ? Math.max(...recipeCategories.map((c: any) => c.sort_order)) : 0;
                await createRecipeCategory({ name: newRecipeCat.trim(), sort_order: maxOrder + 1 });
                queryClient.invalidateQueries({ queryKey: ["recipe_categories"] });
                setNewRecipeCat("");
              }
            }} disabled={!newRecipeCat.trim()} className="min-h-[44px]">Tilføj</Button>
          </div>
        </TabsContent>

        {/* === Family Members === */}
        <TabsContent value="family-members" className="space-y-3">
          <div className="space-y-2">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
                {editingMember?.id === m.id ? (
                  <>
                    <input type="color" value={editingMember.color} onChange={(e) => setEditingMember({ ...editingMember, color: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
                    <Input value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} className="flex-1 min-h-[44px]" />
                    <Button size="sm" onClick={() => updateMemberMut.mutate(editingMember)} className="min-h-[44px]">Gem</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingMember(null)} className="min-h-[44px]">Annuller</Button>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="flex-1">{m.name}</span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingMember({ ...m })} className="min-h-[44px] min-w-[44px]"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMemberMut.mutate(m.id)} className="min-h-[44px] min-w-[44px] text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <input type="color" value={newMember.color} onChange={(e) => setNewMember({ ...newMember, color: e.target.value })} className="w-8 h-8 rounded border-0 cursor-pointer" />
            <Input placeholder="Nyt medlem..." value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="flex-1 min-h-[44px]" />
            <Button onClick={() => newMember.name && addMemberMut.mutate(newMember)} disabled={!newMember.name} className="min-h-[44px]">Tilføj</Button>
          </div>
        </TabsContent>
      </Tabs>
        </div>

        {/* Right: Data import/export */}
        <div>
          <div className="flex gap-1 border-b border-border mb-4">
            <button className="px-4 py-2.5 text-sm font-medium transition-colors relative min-h-[44px] rounded-t-lg text-primary bg-primary/5">
              Data
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            </button>
          </div>
          <DataImportExport />
        </div>
      </div>

      {/* Delete recipe category confirmation */}
      <AlertDialog open={!!deletingRecipeCat} onOpenChange={(open) => { if (!open) setDeletingRecipeCat(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette kategorien "{deletingRecipeCat?.name}"? Opskrifter med denne kategori vil blive sat til "Ukategoriseret".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Annuller</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px]" onClick={async () => {
              if (!deletingRecipeCat) return;
              await clearRecipeCategoryOnRecipes(deletingRecipeCat.name);
              await deleteRecipeCategory(deletingRecipeCat.id);
              queryClient.invalidateQueries({ queryKey: ["recipe_categories"] });
              queryClient.invalidateQueries({ queryKey: ["recipes_paginated"] });
              setDeletingRecipeCat(null);
            }}>Slet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create product dialog */}
      <Dialog open={showCreateProduct} onOpenChange={setShowCreateProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Opret ny vare</DialogTitle></DialogHeader>
          <ProductForm values={newProduct} onChange={setNewProduct} categories={itemCategories} />
          <DialogFooter>
            <Button onClick={() => newProduct.name && createProductMut.mutate(newProduct)} disabled={!newProduct.name} className="min-h-[44px]">Opret vare</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit product dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Rediger vare</DialogTitle></DialogHeader>
          {editingProduct && <ProductForm values={editingProduct} onChange={setEditingProduct} categories={itemCategories} />}
          <DialogFooter>
            <Button onClick={() => editingProduct && updateProductMut.mutate(editingProduct)} className="min-h-[44px]">Gem ændringer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
