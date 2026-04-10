import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, Database, FileSpreadsheet, AlertTriangle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";
import {
  getItemCategories,
  getProducts,
  getRecipeCategories,
  getRecipes,
  getFamilyMembers,
  getCalendarEventsAll,
  getMealPlansAll,
} from "@/lib/api";
import { getRecipeIngredients } from "@/lib/api/recipeIngredients";
import { isLocalMode } from "@/config/env";
import { api } from "@/lib/api/client";
import { deleteAllData, seedDemoData } from "@/lib/demoSeed";

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

// ── Lazy Supabase import ─────────────────────────────
let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

// ── upsert helpers (individual import) ───────────────
async function upsertRows(table: string, rows: any[], mapFn: (r: any) => any): Promise<number> {
  let c = 0;
  if (isLocalMode) {
    for (const r of rows) {
      const mapped = mapFn(r);
      if (mapped.id) {
        try { await api.patch(`/${table.replace("_", "-")}/${mapped.id}`, mapped); } catch { await api.post(`/${table.replace("_", "-")}`, mapped); }
      } else {
        await api.post(`/${table.replace("_", "-")}`, mapped);
      }
      c++;
    }
  } else {
    const s = await sb();
    for (const r of rows) {
      const mapped = mapFn(r);
      await (s.from as any)(table).upsert(mapped, { onConflict: "id" });
      c++;
    }
  }
  return c;
}

// ── data sources ──────────────────────────────────────
interface DataSource {
  key: string;
  label: string;
  table: string;
  exportFn: () => Promise<any[]>;
  mapRow: (r: any) => any;
  /** For recipes we need special handling */
  importFn?: (rows: any[]) => Promise<number>;
  invalidateKeys: string[];
}

function useDataSources(): DataSource[] {
  return [
    {
      key: "item_categories", label: "Varekategorier", table: "item_categories",
      exportFn: getItemCategories,
      mapRow: (r) => ({ id: r.id, name: r.name, sort_order: r.sort_order ?? 0 }),
      invalidateKeys: ["item_categories"],
    },
    {
      key: "products", label: "Varer", table: "products",
      exportFn: getProducts,
      mapRow: (r) => ({
        id: r.id || undefined,
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
      }),
      invalidateKeys: ["products_catalog"],
    },
    {
      key: "recipe_categories", label: "Opskriftkategorier", table: "recipe_categories",
      exportFn: getRecipeCategories,
      mapRow: (r) => ({ id: r.id, name: r.name, sort_order: r.sort_order ?? 0 }),
      invalidateKeys: ["recipe_categories"],
    },
    {
      key: "recipes", label: "Opskrifter", table: "recipes",
      exportFn: async () => {
        const recipes = await getRecipes();
        const result = [];
        for (const r of recipes) {
          const ings = await getRecipeIngredients(r.id);
          result.push({ ...r, ingredients: ings });
        }
        return result;
      },
      mapRow: (r) => r, // not used directly
      importFn: async (rows) => {
        let c = 0;
        for (const r of rows) {
          const { ingredients, item_categories, ...recipe } = r;
          // Upsert recipe
          const { data: upserted } = await supabase.from("recipes").upsert(recipe, { onConflict: "id" }).select("id").single();
          const recipeId = upserted?.id || recipe.id;
          if (recipeId && Array.isArray(ingredients) && ingredients.length) {
            // Delete existing ingredients for this recipe, then re-insert
            await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
            const mapped = ingredients.map((ing: any) => ({
              recipe_id: recipeId,
              product_id: ing.product_id || null,
              name: ing.name || ing.product_name || "",
              quantity: Number(ing.quantity) || 1,
              unit: ing.unit || "stk",
              is_staple: ing.is_staple === true || ing.is_staple === "true",
            }));
            await supabase.from("recipe_ingredients").insert(mapped);
          }
          c++;
        }
        return c;
      },
      invalidateKeys: ["recipes_paginated", "recipes"],
    },
    {
      key: "family_members", label: "Familiemedlemmer", table: "family_members",
      exportFn: getFamilyMembers,
      mapRow: (r) => ({ id: r.id, name: r.name, color: r.color ?? "#8B9DC3" }),
      invalidateKeys: ["family_members"],
    },
    {
      key: "calendar_events", label: "Kalenderbegivenheder", table: "calendar_events",
      exportFn: getCalendarEventsAll,
      mapRow: (r) => {
        const { family_members, ...rest } = r;
        return rest;
      },
      invalidateKeys: ["calendar_events"],
    },
    {
      key: "meal_plans", label: "Madplaner", table: "meal_plans",
      exportFn: getMealPlansAll,
      mapRow: (r) => {
        const { recipes, ...rest } = r;
        return rest;
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
  const [confirmImportAll, setConfirmImportAll] = useState<File | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const sources = useDataSources();

  const handleExportExcel = async (src: DataSource) => {
    setLoading(src.key + "-export");
    try {
      const data = await src.exportFn();
      if (src.key === "recipes") {
        const flat = data.flatMap((r: any) => {
          const { ingredients, ...recipe } = r;
          if (!ingredients?.length) return [{ ...recipe, ingredient_name: "", ingredient_qty: "", ingredient_unit: "" }];
          return ingredients.map((ing: any, i: number) => ({
            ...(i === 0 ? recipe : { id: "", title: "", description: "", instructions: "", category: "", prep_time: "", wait_time: "" }),
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

  // Individual import: upsert (update if ID exists, insert if not)
  const handleImportExcel = async (src: DataSource, file: File) => {
    setLoading(src.key + "-import");
    setProgress(0);
    try {
      const rows = await parseXlsx(file);
      if (!rows.length) throw new Error("Filen er tom.");
      let count: number;
      if (src.importFn) {
        count = await src.importFn(rows);
      } else {
        count = await upsertRows(src.table, rows, src.mapRow);
      }
      src.invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      toast({ title: "Importeret", description: `${count} rækker upsert'et til ${src.label.toLowerCase()}.` });
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

  // Full backup import: DELETE ALL then insert fresh
  const handleImportAllJson = async (file: File) => {
    setLoading("json-import");
    setProgress(0);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, any[]>;

      // Step 1: Delete all in reverse dependency order
      const deleteOrder = [
        "shopping_list_items", "order_lines", "orders",
        "meal_plans", "calendar_events", "recipe_ingredients",
        "recipes", "products", "family_members",
        "recipe_categories", "item_categories",
      ];
      setProgress(5);
      for (const table of deleteOrder) {
        await deleteAllFrom(table);
      }
      setProgress(20);

      // Step 2: Insert in dependency order
      const insertOrder = ["item_categories", "recipe_categories", "family_members", "products", "recipes", "calendar_events", "meal_plans"];
      let step = 0;
      for (const key of insertOrder) {
        step++;
        setProgress(20 + Math.round((step / insertOrder.length) * 80));
        const rows = data[key];
        if (!rows?.length) continue;
        const src = sources.find((s) => s.key === key);
        if (!src) continue;

        if (src.importFn) {
          await src.importFn(rows);
        } else {
          for (const r of rows) {
            const mapped = src.mapRow(r);
            await (supabase.from as any)(src.table).insert(mapped);
          }
        }
      }

      sources.forEach((s) => s.invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] })));
      toast({ title: "Backup importeret", description: "Alle data er slettet og genindlæst fra backup." });
    } catch (e: any) {
      toast({ title: "Importfejl", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setProgress(0);
    }
  };

  const handleResetAll = async () => {
    setLoading("reset");
    setProgress(0);
    try {
      setProgress(10);
      await deleteAllData();
      setProgress(40);
      await seedDemoData((p) => setProgress(40 + Math.round(p * 0.6)));
      sources.forEach((s) => s.invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] })));
      queryClient.invalidateQueries({ queryKey: ["shopping_list"] });
      toast({ title: "Nulstillet", description: "Alt data er slettet og demo-data er indlæst." });
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
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
          <p className="text-xs text-muted-foreground">
            Opdaterer eksisterende rækker (via ID) eller opretter nye.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {sources.map((src) => (
            <div key={src.key} className="flex items-center gap-2 py-1.5">
              <span className="flex-1 text-sm">{src.label}</span>
              <Button
                size="sm" variant="outline" disabled={isLoading}
                onClick={() => handleExportExcel(src)}
                className="min-h-[36px] gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Eksportér
              </Button>
              <Button
                size="sm" variant="outline" disabled={isLoading}
                onClick={() => fileInputRefs.current[src.key]?.click()}
                className="min-h-[36px] gap-1.5 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                Importér
              </Button>
              <input
                ref={(el) => { fileInputRefs.current[src.key] = el; }}
                type="file" accept=".xlsx,.xls" className="hidden"
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
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            Import sletter <strong>alt</strong> eksisterende data og erstatter med backup.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline" disabled={isLoading}
              onClick={handleExportAllJson}
              className="flex-1 min-h-[44px] gap-2"
            >
              <Download className="h-4 w-4" />
              Eksportér alt
            </Button>
            <Button
              variant="outline" disabled={isLoading}
              onClick={() => jsonInputRef.current?.click()}
              className="flex-1 min-h-[44px] gap-2"
            >
              <Upload className="h-4 w-4" />
              Importér alt
            </Button>
            <input
              ref={jsonInputRef} type="file" accept=".json" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setConfirmImportAll(f);
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

      {/* Reset all */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Nulstil alt
          </CardTitle>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            Sletter <strong>alt</strong> data og indlæser et demo-datasæt.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive" disabled={isLoading}
            onClick={() => setConfirmReset(true)}
            className="w-full min-h-[44px] gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Nulstil til demo-data
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation dialog for destructive full import */}
      <AlertDialog open={!!confirmImportAll} onOpenChange={() => setConfirmImportAll(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette vil <strong>slette alle eksisterende data</strong> (varer, opskrifter, madplaner, kalender, indkøbsliste m.m.)
              og erstatte dem med indholdet fra backup-filen. Handlingen kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmImportAll) handleImportAllJson(confirmImportAll);
                setConfirmImportAll(null);
              }}
            >
              Slet alt og importér
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog for reset */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Nulstil hele databasen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Dette vil <strong>permanent slette alle dine data</strong>, herunder:
              </span>
              <span className="block text-sm">
                • Alle varer og varekategorier<br />
                • Alle opskrifter og opskriftkategorier<br />
                • Alle familiemedlemmer<br />
                • Alle kalenderbegivenheder<br />
                • Alle madplaner<br />
                • Hele indkøbslisten og ordrehistorik
              </span>
              <span className="block font-medium text-destructive">
                Derefter indlæses et demo-datasæt. Handlingen kan ikke fortrydes.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                handleResetAll();
                setConfirmReset(false);
              }}
            >
              Ja, slet alt og nulstil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
