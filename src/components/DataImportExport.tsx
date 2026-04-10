import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, Database, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  getItemCategories, createItemCategory,
  getProducts, createProduct,
  getRecipeCategories, createRecipeCategory,
  getRecipes, createRecipe,
  getFamilyMembers, createFamilyMember,
  getCalendarEventsAll, upsertCalendarEvent,
  getMealPlansAll, createMealPlan,
} from "@/lib/api";
import { getRecipeIngredients, saveRecipeIngredients } from "@/lib/api/recipeIngredients";

// ── helpers ──────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadXlsx(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

async function parseXlsx(file: File): Promise<any[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws);
}

// ── data sources ──────────────────────────────────────
interface DataSource {
  key: string;
  label: string;
  exportFn: () => Promise<any[]>;
  importFn: (rows: any[]) => Promise<number>;
  invalidateKeys: string[];
}

function useDataSources(): DataSource[] {
  return [
    {
      key: "item_categories", label: "Varekategorier",
      exportFn: getItemCategories,
      importFn: async (rows) => {
        let c = 0;
        for (const r of rows) { await createItemCategory({ name: r.name, sort_order: r.sort_order ?? 0 }); c++; }
        return c;
      },
      invalidateKeys: ["item_categories"],
    },
    {
      key: "products", label: "Varer",
      exportFn: getProducts,
      importFn: async (rows) => {
        let c = 0;
        for (const r of rows) {
          await createProduct({
            name: r.name, unit: r.unit ?? "stk", category_id: r.category_id || null,
            description: r.description || null, size_label: r.size_label || null,
            price: r.price ? Number(r.price) : null, image_url: r.image_url || null,
            is_favorite: r.is_favorite === true || r.is_favorite === "true",
            is_staple: r.is_staple === true || r.is_staple === "true",
            is_manual: true,
            calories_per_100g: r.calories_per_100g ? Number(r.calories_per_100g) : null,
            fat_per_100g: r.fat_per_100g ? Number(r.fat_per_100g) : null,
            carbs_per_100g: r.carbs_per_100g ? Number(r.carbs_per_100g) : null,
            protein_per_100g: r.protein_per_100g ? Number(r.protein_per_100g) : null,
            fiber_per_100g: r.fiber_per_100g ? Number(r.fiber_per_100g) : null,
          });
          c++;
        }
        return c;
      },
      invalidateKeys: ["products_catalog"],
    },
    {
      key: "recipe_categories", label: "Opskriftkategorier",
      exportFn: getRecipeCategories,
      importFn: async (rows) => {
        let c = 0;
        for (const r of rows) { await createRecipeCategory({ name: r.name, sort_order: r.sort_order ?? 0 }); c++; }
        return c;
      },
      invalidateKeys: ["recipe_categories"],
    },
    {
      key: "recipes", label: "Opskrifter",
      exportFn: async () => {
        const recipes = await getRecipes();
        const result = [];
        for (const r of recipes) {
          const ings = await getRecipeIngredients(r.id);
          result.push({ ...r, ingredients: ings });
        }
        return result;
      },
      importFn: async (rows) => {
        let c = 0;
        for (const r of rows) {
          const { ingredients, id, created_at, updated_at, ...recipe } = r;
          const created = await createRecipe(recipe);
          if (created?.id && Array.isArray(ingredients)) {
            const mapped = ingredients.map((ing: any) => ({
              product_id: ing.product_id || null,
              product_name: ing.name || ing.product_name || "",
              quantity: Number(ing.quantity) || 1,
              unit: ing.unit || "stk",
              is_staple: ing.is_staple === true || ing.is_staple === "true",
            }));
            if (mapped.length) await saveRecipeIngredients(created.id, mapped);
          }
          c++;
        }
        return c;
      },
      invalidateKeys: ["recipes_paginated", "recipes"],
    },
    {
      key: "family_members", label: "Familiemedlemmer",
      exportFn: getFamilyMembers,
      importFn: async (rows) => {
        let c = 0;
        for (const r of rows) { await createFamilyMember({ name: r.name, color: r.color ?? "#8B9DC3" }); c++; }
        return c;
      },
      invalidateKeys: ["family_members"],
    },
    {
      key: "calendar_events", label: "Kalenderbegivenheder",
      exportFn: getCalendarEventsAll,
      importFn: async (rows) => {
        let c = 0;
        for (const r of rows) {
          const { id, created_at, family_members, ...rest } = r;
          await upsertCalendarEvent(rest);
          c++;
        }
        return c;
      },
      invalidateKeys: ["calendar_events"],
    },
    {
      key: "meal_plans", label: "Madplaner",
      exportFn: getMealPlansAll,
      importFn: async (rows) => {
        let c = 0;
        for (const r of rows) {
          const { id, created_at, recipes, ...rest } = r;
          await createMealPlan(rest);
          c++;
        }
        return c;
      },
      invalidateKeys: ["meal_plans"],
    },
  ];
}

// ── component ──────────────────────────────────────
export function DataImportExport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const sources = useDataSources();

  const handleExportExcel = async (src: DataSource) => {
    setLoading(src.key + "-export");
    try {
      const data = await src.exportFn();
      if (src.key === "recipes") {
        // Flatten ingredients for Excel
        const flat = data.flatMap((r: any) => {
          const { ingredients, ...recipe } = r;
          if (!ingredients?.length) return [{ ...recipe, ingredient_name: "", ingredient_qty: "", ingredient_unit: "" }];
          return ingredients.map((ing: any, i: number) => ({
            ...(i === 0 ? recipe : { title: "", description: "", instructions: "", category: "", prep_time: "", wait_time: "" }),
            ingredient_name: ing.name || "", ingredient_qty: ing.quantity ?? "", ingredient_unit: ing.unit || "",
            ingredient_is_staple: ing.is_staple ?? false,
          }));
        });
        downloadXlsx(flat, `${src.key}.xlsx`);
      } else {
        downloadXlsx(data, `${src.key}.xlsx`);
      }
      toast({ title: "Eksporteret", description: `${data.length} ${src.label.toLowerCase()} eksporteret.` });
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleImportExcel = async (src: DataSource, file: File) => {
    setLoading(src.key + "-import");
    setProgress(0);
    try {
      const rows = await parseXlsx(file);
      if (!rows.length) throw new Error("Filen er tom.");
      const count = await src.importFn(rows);
      src.invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      toast({ title: "Importeret", description: `${count} rækker importeret til ${src.label.toLowerCase()}.` });
    } catch (e: any) {
      toast({ title: "Importfejl", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setProgress(0);
    }
  };

  const handleExportAllJson = async () => {
    setLoading("json-export");
    try {
      const result: Record<string, any[]> = {};
      for (let i = 0; i < sources.length; i++) {
        setProgress(Math.round(((i + 1) / sources.length) * 100));
        result[sources[i].key] = await sources[i].exportFn();
      }
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      downloadBlob(blob, `backup_${new Date().toISOString().slice(0, 10)}.json`);
      toast({ title: "Backup eksporteret", description: "Alle data er samlet i én JSON-fil." });
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setProgress(0);
    }
  };

  const handleImportAllJson = async (file: File) => {
    setLoading("json-import");
    setProgress(0);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, any[]>;
      // Import in dependency order
      const order = ["item_categories", "recipe_categories", "family_members", "products", "recipes", "calendar_events", "meal_plans"];
      let step = 0;
      for (const key of order) {
        step++;
        setProgress(Math.round((step / order.length) * 100));
        const rows = data[key];
        if (!rows?.length) continue;
        const src = sources.find((s) => s.key === key);
        if (src) await src.importFn(rows);
      }
      sources.forEach((s) => s.invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] })));
      toast({ title: "Backup importeret", description: "Alle data er importeret." });
    } catch (e: any) {
      toast({ title: "Importfejl", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setProgress(0);
    }
  };

  const isLoading = loading !== null;

  return (
    <div className="space-y-4">
      {/* Individual Excel import/export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Individuel import/eksport (Excel)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sources.map((src) => (
            <div key={src.key} className="flex items-center gap-2 py-1.5">
              <span className="flex-1 text-sm">{src.label}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
                onClick={() => handleExportExcel(src)}
                className="min-h-[36px] gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Eksportér
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
                onClick={() => fileInputRefs.current[src.key]?.click()}
                className="min-h-[36px] gap-1.5 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                Importér
              </Button>
              <input
                ref={(el) => { fileInputRefs.current[src.key] = el; }}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportExcel(src, f);
                  e.target.value = "";
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Full JSON backup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Samlet backup (JSON)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={handleExportAllJson}
              className="flex-1 min-h-[44px] gap-2"
            >
              <Download className="h-4 w-4" />
              Eksportér alt
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => jsonInputRef.current?.click()}
              className="flex-1 min-h-[44px] gap-2"
            >
              <Upload className="h-4 w-4" />
              Importér alt
            </Button>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportAllJson(f);
                e.target.value = "";
              }}
            />
          </div>
          {isLoading && progress > 0 && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{progress}%</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
