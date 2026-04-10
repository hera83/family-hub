import { supabase } from "@/integrations/supabase/client";

// ── Delete all data from all tables ──────────────────
const DELETE_ORDER = [
  "shopping_list_items", "order_lines", "orders",
  "meal_plans", "calendar_events", "recipe_ingredients",
  "recipes", "products", "family_members",
  "recipe_categories", "item_categories",
];

async function deleteAllFrom(table: string) {
  await (supabase.from as any)(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

export async function deleteAllData() {
  for (const table of DELETE_ORDER) {
    await deleteAllFrom(table);
  }
}

// ── Demo data ────────────────────────────────────────
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

interface DemoProduct {
  name: string;
  unit: string;
  categoryKey: number; // index into DEMO_ITEM_CATEGORIES
  is_staple?: boolean;
  price?: number;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  { name: "Tomater", unit: "stk", categoryKey: 0, price: 15 },
  { name: "Agurk", unit: "stk", categoryKey: 0, price: 10 },
  { name: "Kartofler", unit: "kg", categoryKey: 0, price: 12, is_staple: true },
  { name: "Løg", unit: "stk", categoryKey: 0, price: 5, is_staple: true },
  { name: "Hvidløg", unit: "stk", categoryKey: 0, price: 8, is_staple: true },
  { name: "Gulerødder", unit: "kg", categoryKey: 0, price: 15 },
  { name: "Citron", unit: "stk", categoryKey: 0, price: 5 },
  { name: "Sødmælk", unit: "l", categoryKey: 1, price: 12 },
  { name: "Smør", unit: "stk", categoryKey: 1, price: 18, is_staple: true },
  { name: "Æg (10 stk)", unit: "pk", categoryKey: 1, price: 25 },
  { name: "Ost (revet)", unit: "pk", categoryKey: 1, price: 22 },
  { name: "Fløde (38%)", unit: "stk", categoryKey: 1, price: 14 },
  { name: "Hakket oksekød", unit: "pk", categoryKey: 2, price: 45 },
  { name: "Kyllingebryster", unit: "pk", categoryKey: 2, price: 55 },
  { name: "Laks (filet)", unit: "pk", categoryKey: 2, price: 65 },
  { name: "Bacon", unit: "pk", categoryKey: 2, price: 30 },
  { name: "Rugbrød", unit: "stk", categoryKey: 3, price: 20 },
  { name: "Hvidt brød", unit: "stk", categoryKey: 3, price: 18 },
  { name: "Pasta (spaghetti)", unit: "pk", categoryKey: 4, price: 12, is_staple: true },
  { name: "Ris", unit: "pk", categoryKey: 4, price: 18, is_staple: true },
  { name: "Olivenolie", unit: "fl", categoryKey: 4, price: 35, is_staple: true },
  { name: "Hakkede tomater (dåse)", unit: "ds", categoryKey: 4, price: 8 },
  { name: "Tomatpuré", unit: "stk", categoryKey: 4, price: 10, is_staple: true },
  { name: "Salt", unit: "stk", categoryKey: 4, is_staple: true },
  { name: "Peber", unit: "stk", categoryKey: 4, is_staple: true },
  { name: "Frosne ærter", unit: "pk", categoryKey: 5, price: 15 },
  { name: "Appelsinjuice", unit: "l", categoryKey: 6, price: 18 },
  { name: "Mælk (mini)", unit: "l", categoryKey: 6, price: 10 },
];

interface DemoRecipe {
  title: string;
  description: string;
  instructions: string;
  category: string;
  prep_time: number;
  wait_time?: number;
  ingredients: { productIndex: number; quantity: number; unit: string }[];
}

const DEMO_RECIPES: DemoRecipe[] = [
  {
    title: "Spaghetti Bolognese",
    description: "Klassisk italiensk pastaret med kødssauce",
    instructions: "1. Brun hakket oksekød i en gryde.\n2. Tilsæt hakket løg og hvidløg.\n3. Hæld hakkede tomater og tomatpuré i.\n4. Lad simre i 30 min.\n5. Kog spaghetti.\n6. Server sauce over pasta med revet ost.",
    category: "Hovedret",
    prep_time: 15,
    wait_time: 30,
    ingredients: [
      { productIndex: 12, quantity: 500, unit: "g" },
      { productIndex: 3, quantity: 1, unit: "stk" },
      { productIndex: 4, quantity: 2, unit: "fed" },
      { productIndex: 21, quantity: 1, unit: "ds" },
      { productIndex: 22, quantity: 2, unit: "spsk" },
      { productIndex: 18, quantity: 400, unit: "g" },
      { productIndex: 10, quantity: 100, unit: "g" },
    ],
  },
  {
    title: "Kylling med ris og grøntsager",
    description: "Enkel hverdagsret med stegt kylling",
    instructions: "1. Skær kyllingebryster i tern.\n2. Steg i olivenolie med salt og peber.\n3. Tilsæt gulerødder i skiver.\n4. Kog ris efter anvisning.\n5. Server kylling og grønt over ris.",
    category: "Hovedret",
    prep_time: 10,
    wait_time: 20,
    ingredients: [
      { productIndex: 13, quantity: 400, unit: "g" },
      { productIndex: 19, quantity: 300, unit: "g" },
      { productIndex: 5, quantity: 200, unit: "g" },
      { productIndex: 20, quantity: 2, unit: "spsk" },
    ],
  },
  {
    title: "Laks med kartofler og citron",
    description: "Ovnbagt laks med nye kartofler",
    instructions: "1. Varm ovn til 200°C.\n2. Læg laksefileter på bageplade.\n3. Drys med salt, peber og citronsaft.\n4. Bag i 18 min.\n5. Kog kartofler.\n6. Server med smør.",
    category: "Hovedret",
    prep_time: 10,
    wait_time: 18,
    ingredients: [
      { productIndex: 14, quantity: 400, unit: "g" },
      { productIndex: 2, quantity: 500, unit: "g" },
      { productIndex: 6, quantity: 1, unit: "stk" },
      { productIndex: 8, quantity: 20, unit: "g" },
    ],
  },
  {
    title: "Tomatsuppe",
    description: "Cremet tomatsuppe med fløde",
    instructions: "1. Svits hakket løg og hvidløg.\n2. Tilsæt hakkede tomater og vand.\n3. Kog i 15 min.\n4. Blend til glat suppe.\n5. Rør fløde i.\n6. Smag til med salt og peber.\n7. Server med brød.",
    category: "Suppe",
    prep_time: 10,
    wait_time: 15,
    ingredients: [
      { productIndex: 3, quantity: 1, unit: "stk" },
      { productIndex: 4, quantity: 2, unit: "fed" },
      { productIndex: 21, quantity: 2, unit: "ds" },
      { productIndex: 11, quantity: 1, unit: "dl" },
    ],
  },
  {
    title: "Tomatsalat",
    description: "Frisk salat med tomater og agurk",
    instructions: "1. Skær tomater og agurk i skiver.\n2. Bland med olivenolie og salt.\n3. Server som tilbehør.",
    category: "Salat",
    prep_time: 5,
    ingredients: [
      { productIndex: 0, quantity: 3, unit: "stk" },
      { productIndex: 1, quantity: 1, unit: "stk" },
      { productIndex: 20, quantity: 1, unit: "spsk" },
    ],
  },
];

// ── Seed function ────────────────────────────────────
export async function seedDemoData(onProgress?: (pct: number) => void) {
  const progress = (p: number) => onProgress?.(p);

  // 1. Item categories
  progress(5);
  const { data: catData } = await supabase.from("item_categories").insert(DEMO_ITEM_CATEGORIES).select("id");
  const catIds = catData?.map((c) => c.id) || [];

  // 2. Recipe categories
  progress(10);
  await supabase.from("recipe_categories").insert(DEMO_RECIPE_CATEGORIES);

  // 3. Family members
  progress(15);
  await supabase.from("family_members").insert(DEMO_FAMILY_MEMBERS);

  // 4. Products
  progress(25);
  const productInserts = DEMO_PRODUCTS.map((p) => ({
    name: p.name,
    unit: p.unit,
    category_id: catIds[p.categoryKey] || null,
    is_staple: p.is_staple ?? false,
    is_manual: true,
    price: p.price ?? null,
  }));
  const { data: prodData } = await supabase.from("products").insert(productInserts).select("id");
  const prodIds = prodData?.map((p) => p.id) || [];

  // 5. Recipes + ingredients
  progress(40);
  for (let i = 0; i < DEMO_RECIPES.length; i++) {
    const dr = DEMO_RECIPES[i];
    const { data: recipeRow } = await supabase.from("recipes").insert({
      title: dr.title,
      description: dr.description,
      instructions: dr.instructions,
      category: dr.category,
      prep_time: dr.prep_time,
      wait_time: dr.wait_time ?? null,
      is_manual: true,
    }).select("id").single();

    if (recipeRow?.id) {
      const ings = dr.ingredients.map((ing) => ({
        recipe_id: recipeRow.id,
        product_id: prodIds[ing.productIndex] || null,
        name: DEMO_PRODUCTS[ing.productIndex]?.name || "",
        quantity: ing.quantity,
        unit: ing.unit,
      }));
      await supabase.from("recipe_ingredients").insert(ings);
    }
    progress(40 + Math.round(((i + 1) / DEMO_RECIPES.length) * 40));
  }

  // 6. Calendar events (a few demo events this week)
  progress(85);
  const today = new Date();
  const dayStr = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  await supabase.from("calendar_events").insert([
    { title: "Indkøb", event_date: dayStr(1), start_time: "10:00", end_time: "11:00" },
    { title: "Madlavning", event_date: dayStr(2), start_time: "17:00", end_time: "18:30" },
    { title: "Familieaften", event_date: dayStr(3), start_time: "18:00", end_time: "20:00" },
  ]);

  // 7. Meal plans (no recipes linked — just empty slots示意)
  progress(95);

  progress(100);
}

// ── Check if database is empty ───────────────────────
export async function isDatabaseEmpty(): Promise<boolean> {
  const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
  return (count ?? 0) === 0;
}
