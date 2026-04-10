import { isLocalMode } from "@/config/env";
import { api } from "@/lib/api/client";

// ── Lazy Supabase import ─────────────────────────────
let _supabase: any = null;
async function sb() {
  if (!_supabase) { const mod = await import("@/integrations/supabase/client"); _supabase = mod.supabase; }
  return _supabase;
}

// ── Delete all data ──────────────────────────────────
export async function deleteAllData() {
  if (isLocalMode) {
    await api.post("/seed/delete-all", {});
    return;
  }
  const s = await sb();
  const tables = [
    "shopping_list_items", "order_lines", "orders",
    "meal_plans", "calendar_events", "recipe_ingredients",
    "recipes", "products", "family_members",
    "recipe_categories", "item_categories",
  ];
  for (const table of tables) {
    await (s.from as any)(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
}

// ── Seed demo data ───────────────────────────────────
export async function seedDemoData(onProgress?: (pct: number) => void) {
  const progress = (p: number) => onProgress?.(p);

  if (isLocalMode) {
    progress(10);
    await api.post("/seed/seed", {});
    progress(100);
    return;
  }

  // Supabase mode - inline seed
  const s = await sb();

  const DEMO_ITEM_CATEGORIES = [
    { name: "Frugt & grønt", sort_order: 1 },
    { name: "Mejeri & æg", sort_order: 2 },
    { name: "Kød & fisk", sort_order: 3 },
    { name: "Brød & bagværk", sort_order: 4 },
    { name: "Kolonial", sort_order: 5 },
    { name: "Frost", sort_order: 6 },
    { name: "Drikkevarer", sort_order: 7 },
  ];

  const DEMO_RECIPE_CATEGORIES = [
    { name: "Hovedret", sort_order: 1 },
    { name: "Forret", sort_order: 2 },
    { name: "Dessert", sort_order: 3 },
    { name: "Salat", sort_order: 4 },
    { name: "Suppe", sort_order: 5 },
  ];

  const DEMO_FAMILY_MEMBERS = [
    { name: "Far", color: "#4A90D9" },
    { name: "Mor", color: "#E88DD6" },
    { name: "Barn 1", color: "#5CC98C" },
    { name: "Barn 2", color: "#F5A623" },
  ];

  const DEMO_PRODUCTS = [
    { name: "Tomater", unit: "stk", catIdx: 0, price: 15 },
    { name: "Agurk", unit: "stk", catIdx: 0, price: 10 },
    { name: "Kartofler", unit: "kg", catIdx: 0, price: 12, is_staple: true },
    { name: "Løg", unit: "stk", catIdx: 0, price: 5, is_staple: true },
    { name: "Hvidløg", unit: "stk", catIdx: 0, price: 8, is_staple: true },
    { name: "Gulerødder", unit: "kg", catIdx: 0, price: 15 },
    { name: "Citron", unit: "stk", catIdx: 0, price: 5 },
    { name: "Sødmælk", unit: "l", catIdx: 1, price: 12 },
    { name: "Smør", unit: "stk", catIdx: 1, price: 18, is_staple: true },
    { name: "Æg (10 stk)", unit: "pk", catIdx: 1, price: 25 },
    { name: "Ost (revet)", unit: "pk", catIdx: 1, price: 22 },
    { name: "Fløde (38%)", unit: "stk", catIdx: 1, price: 14 },
    { name: "Hakket oksekød", unit: "pk", catIdx: 2, price: 45 },
    { name: "Kyllingebryster", unit: "pk", catIdx: 2, price: 55 },
    { name: "Laks (filet)", unit: "pk", catIdx: 2, price: 65 },
    { name: "Bacon", unit: "pk", catIdx: 2, price: 30 },
    { name: "Rugbrød", unit: "stk", catIdx: 3, price: 20 },
    { name: "Hvidt brød", unit: "stk", catIdx: 3, price: 18 },
    { name: "Pasta (spaghetti)", unit: "pk", catIdx: 4, price: 12, is_staple: true },
    { name: "Ris", unit: "pk", catIdx: 4, price: 18, is_staple: true },
    { name: "Olivenolie", unit: "fl", catIdx: 4, price: 35, is_staple: true },
    { name: "Hakkede tomater (dåse)", unit: "ds", catIdx: 4, price: 8 },
    { name: "Tomatpuré", unit: "stk", catIdx: 4, price: 10, is_staple: true },
    { name: "Salt", unit: "stk", catIdx: 4, is_staple: true },
    { name: "Peber", unit: "stk", catIdx: 4, is_staple: true },
    { name: "Frosne ærter", unit: "pk", catIdx: 5, price: 15 },
    { name: "Appelsinjuice", unit: "l", catIdx: 6, price: 18 },
    { name: "Mælk (mini)", unit: "l", catIdx: 6, price: 10 },
  ];

  const DEMO_RECIPES = [
    {
      title: "Spaghetti Bolognese", description: "Klassisk italiensk pastaret med kødssauce",
      instructions: "1. Brun hakket oksekød.\n2. Tilsæt løg og hvidløg.\n3. Hæld hakkede tomater og tomatpuré i.\n4. Simre 30 min.\n5. Kog spaghetti.\n6. Server med revet ost.",
      category: "Hovedret", prep_time: 15, wait_time: 30,
      ingredients: [
        { prodIdx: 12, quantity: 500, unit: "g" }, { prodIdx: 3, quantity: 1, unit: "stk" },
        { prodIdx: 4, quantity: 2, unit: "fed" }, { prodIdx: 21, quantity: 1, unit: "ds" },
        { prodIdx: 22, quantity: 2, unit: "spsk" }, { prodIdx: 18, quantity: 400, unit: "g" },
        { prodIdx: 10, quantity: 100, unit: "g" },
      ],
    },
    {
      title: "Kylling med ris og grøntsager", description: "Enkel hverdagsret med stegt kylling",
      instructions: "1. Skær kylling i tern.\n2. Steg i olivenolie.\n3. Tilsæt gulerødder.\n4. Kog ris.\n5. Server.",
      category: "Hovedret", prep_time: 10, wait_time: 20,
      ingredients: [
        { prodIdx: 13, quantity: 400, unit: "g" }, { prodIdx: 19, quantity: 300, unit: "g" },
        { prodIdx: 5, quantity: 200, unit: "g" }, { prodIdx: 20, quantity: 2, unit: "spsk" },
      ],
    },
    {
      title: "Laks med kartofler og citron", description: "Ovnbagt laks med nye kartofler",
      instructions: "1. Varm ovn til 200°C.\n2. Læg laks på bageplade.\n3. Drys med salt, peber, citronsaft.\n4. Bag 18 min.\n5. Kog kartofler.\n6. Server med smør.",
      category: "Hovedret", prep_time: 10, wait_time: 18,
      ingredients: [
        { prodIdx: 14, quantity: 400, unit: "g" }, { prodIdx: 2, quantity: 500, unit: "g" },
        { prodIdx: 6, quantity: 1, unit: "stk" }, { prodIdx: 8, quantity: 20, unit: "g" },
      ],
    },
    {
      title: "Tomatsuppe", description: "Cremet tomatsuppe med fløde",
      instructions: "1. Svits løg og hvidløg.\n2. Tilsæt tomater og vand.\n3. Kog 15 min.\n4. Blend.\n5. Rør fløde i.\n6. Server med brød.",
      category: "Suppe", prep_time: 10, wait_time: 15,
      ingredients: [
        { prodIdx: 3, quantity: 1, unit: "stk" }, { prodIdx: 4, quantity: 2, unit: "fed" },
        { prodIdx: 21, quantity: 2, unit: "ds" }, { prodIdx: 11, quantity: 1, unit: "dl" },
      ],
    },
    {
      title: "Tomatsalat", description: "Frisk salat med tomater og agurk",
      instructions: "1. Skær tomater og agurk.\n2. Bland med olivenolie og salt.\n3. Server.",
      category: "Salat", prep_time: 5,
      ingredients: [
        { prodIdx: 0, quantity: 3, unit: "stk" }, { prodIdx: 1, quantity: 1, unit: "stk" },
        { prodIdx: 20, quantity: 1, unit: "spsk" },
      ],
    },
  ];

  // 1. Item categories
  progress(5);
  const { data: catData } = await s.from("item_categories").insert(DEMO_ITEM_CATEGORIES).select("id");
  const catIds = catData?.map((c: any) => c.id) || [];

  // 2. Recipe categories
  progress(10);
  await s.from("recipe_categories").insert(DEMO_RECIPE_CATEGORIES);

  // 3. Family members
  progress(15);
  await s.from("family_members").insert(DEMO_FAMILY_MEMBERS);

  // 4. Products
  progress(25);
  const productInserts = DEMO_PRODUCTS.map((p) => ({
    name: p.name, unit: p.unit, category_id: catIds[p.catIdx] || null,
    is_staple: p.is_staple ?? false, is_manual: true, price: p.price ?? null,
  }));
  const { data: prodData } = await s.from("products").insert(productInserts).select("id");
  const prodIds = prodData?.map((p: any) => p.id) || [];

  // 5. Recipes + ingredients
  progress(40);
  for (let i = 0; i < DEMO_RECIPES.length; i++) {
    const dr = DEMO_RECIPES[i];
    const { data: recipeRow } = await s.from("recipes").insert({
      title: dr.title, description: dr.description, instructions: dr.instructions,
      category: dr.category, prep_time: dr.prep_time, wait_time: dr.wait_time ?? null, is_manual: true,
    }).select("id").single();
    if (recipeRow?.id) {
      const ings = dr.ingredients.map((ing) => ({
        recipe_id: recipeRow.id, product_id: prodIds[ing.prodIdx] || null,
        name: DEMO_PRODUCTS[ing.prodIdx]?.name || "", quantity: ing.quantity, unit: ing.unit,
      }));
      await s.from("recipe_ingredients").insert(ings);
    }
    progress(40 + Math.round(((i + 1) / DEMO_RECIPES.length) * 40));
  }

  // 6. Calendar events
  progress(85);
  const today = new Date();
  const dayStr = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  await s.from("calendar_events").insert([
    { title: "Indkøb", event_date: dayStr(1), start_time: "10:00", end_time: "11:00" },
    { title: "Madlavning", event_date: dayStr(2), start_time: "17:00", end_time: "18:30" },
    { title: "Familieaften", event_date: dayStr(3), start_time: "18:00", end_time: "20:00" },
  ]);

  progress(100);
}

// ── Check if database is empty ───────────────────────
export async function isDatabaseEmpty(): Promise<boolean> {
  if (isLocalMode) {
    const result = await api.get<{ empty: boolean }>("/seed/is-empty");
    return result.empty;
  }
  const s = await sb();
  const { count } = await s.from("products").select("*", { count: "exact", head: true });
  return (count ?? 0) === 0;
}
