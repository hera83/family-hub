import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

const DELETE_ORDER = [
  "shopping_list_items", "order_lines", "orders",
  "meal_plans", "calendar_events", "recipe_ingredients",
  "recipes", "products", "family_members",
  "recipe_categories", "item_categories",
];

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

// Check if DB is empty
r.get("/is-empty", async (_req, res) => {
  const row = await queryOne("SELECT COUNT(*)::int as count FROM products");
  res.json({ empty: (row?.count || 0) === 0 });
});

// Delete all data
r.post("/delete-all", async (_req, res) => {
  for (const table of DELETE_ORDER) {
    await query(`DELETE FROM ${table}`);
  }
  res.json({ ok: true });
});

// Seed demo data
r.post("/seed", async (_req, res) => {
  // 1. Item categories
  const catIds: string[] = [];
  for (const c of DEMO_ITEM_CATEGORIES) {
    const row = await queryOne("INSERT INTO item_categories (name, sort_order) VALUES ($1, $2) RETURNING id", [c.name, c.sort_order]);
    catIds.push(row.id);
  }
  // 2. Recipe categories
  for (const c of DEMO_RECIPE_CATEGORIES) {
    await query("INSERT INTO recipe_categories (name, sort_order) VALUES ($1, $2)", [c.name, c.sort_order]);
  }
  // 3. Family members
  for (const m of DEMO_FAMILY_MEMBERS) {
    await query("INSERT INTO family_members (name, color) VALUES ($1, $2)", [m.name, m.color]);
  }
  // 4. Products
  const prodIds: string[] = [];
  for (const p of DEMO_PRODUCTS) {
    const row = await queryOne(
      "INSERT INTO products (name, unit, category_id, is_staple, is_manual, price) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
      [p.name, p.unit, catIds[p.catIdx] || null, p.is_staple || false, true, p.price ?? null]
    );
    prodIds.push(row.id);
  }
  // 5. Recipes + ingredients
  for (const dr of DEMO_RECIPES) {
    const row = await queryOne(
      "INSERT INTO recipes (title, description, instructions, category, prep_time, wait_time, is_manual) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [dr.title, dr.description, dr.instructions, dr.category, dr.prep_time, dr.wait_time ?? null, true]
    );
    for (const ing of dr.ingredients) {
      await query(
        "INSERT INTO recipe_ingredients (recipe_id, product_id, name, quantity, unit) VALUES ($1,$2,$3,$4,$5)",
        [row.id, prodIds[ing.prodIdx] || null, DEMO_PRODUCTS[ing.prodIdx]?.name || "", ing.quantity, ing.unit]
      );
    }
  }
  // 6. Calendar events
  const today = new Date();
  const dayStr = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  await query(
    "INSERT INTO calendar_events (title, event_date, start_time, end_time) VALUES ($1,$2,$3,$4),($5,$6,$7,$8),($9,$10,$11,$12)",
    ["Indkøb", dayStr(1), "10:00", "11:00", "Madlavning", dayStr(2), "17:00", "18:30", "Familieaften", dayStr(3), "18:00", "20:00"]
  );
  res.json({ ok: true });
});

// Reset = delete all + seed
r.post("/reset", async (req, res) => {
  for (const table of DELETE_ORDER) {
    await query(`DELETE FROM ${table}`);
  }
  // Forward to seed logic by calling the handler inline
  // We'll just re-use the seed endpoint via a local fetch or duplicate logic
  // Simplest: redirect internally
  req.url = "/seed";
  req.method = "POST";
  r.handle(req, res, () => {});
});

export { r as seedRouter };
