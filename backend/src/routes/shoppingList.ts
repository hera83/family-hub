import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

r.get("/", async (_req, res) => {
  const rows = await query(
    `SELECT sli.*, row_to_json(ic.*) as item_categories, row_to_json(r.*) as recipes
     FROM shopping_list_items sli
     LEFT JOIN item_categories ic ON sli.category_id = ic.id
     LEFT JOIN recipes r ON sli.recipe_id = r.id
     WHERE sli.is_ordered = false ORDER BY sli.created_at`
  );
  res.json(rows);
});

r.post("/", async (req, res) => {
  const b = req.body;
  const row = await queryOne(
    `INSERT INTO shopping_list_items (product_name, product_id, category_id, quantity, unit, source_type, recipe_id, recipe_qty, recipe_unit, meal_plan_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [b.product_name, b.product_id, b.category_id, b.quantity || 1, b.unit || "stk", b.source_type || "manual", b.recipe_id, b.recipe_qty, b.recipe_unit, b.meal_plan_id]
  );
  res.json(row);
});

r.patch("/:id", async (req, res) => {
  const fields = req.body; const id = req.params.id;
  const sets = Object.keys(fields).map((k, i) => `${k}=$${i + 1}`).join(",");
  const vals = [...Object.values(fields), id];
  await query(`UPDATE shopping_list_items SET ${sets} WHERE id=$${vals.length}`, vals);
  res.json({ ok: true });
});

r.delete("/:id", async (req, res) => {
  await query("DELETE FROM shopping_list_items WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

r.delete("/by-meal-plan/:mealPlanId", async (req, res) => {
  await query("DELETE FROM shopping_list_items WHERE meal_plan_id=$1 AND is_ordered=false", [req.params.mealPlanId]);
  res.json({ ok: true });
});

r.post("/mark-ordered", async (req, res) => {
  const { ids, orderId } = req.body;
  await query(
    "UPDATE shopping_list_items SET is_ordered=true, order_id=$1, ordered_at=now() WHERE id = ANY($2::uuid[])",
    [orderId, ids]
  );
  res.json({ ok: true });
});

r.post("/meal-plan-status", async (req, res) => {
  const { mealPlanIds } = req.body;
  const rows = await query(
    "SELECT meal_plan_id, is_ordered, ordered_at FROM shopping_list_items WHERE meal_plan_id = ANY($1::uuid[])",
    [mealPlanIds]
  );
  const statusMap: Record<string, any> = {};
  rows.forEach((item: any) => {
    if (!item.meal_plan_id) return;
    if (!statusMap[item.meal_plan_id]) statusMap[item.meal_plan_id] = { total: 0, ordered: 0, latestOrderedAt: null };
    statusMap[item.meal_plan_id].total++;
    if (item.is_ordered) {
      statusMap[item.meal_plan_id].ordered++;
      if (!statusMap[item.meal_plan_id].latestOrderedAt || item.ordered_at > statusMap[item.meal_plan_id].latestOrderedAt)
        statusMap[item.meal_plan_id].latestOrderedAt = item.ordered_at;
    }
  });
  res.json(statusMap);
});

export { r as shoppingListRouter };
