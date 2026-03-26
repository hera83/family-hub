import { Router } from "express";
import { query } from "../db.js";
const r = Router();

r.get("/", async (req, res) => {
  const { recipeId } = req.query;
  const rows = await query(
    `SELECT ri.*, row_to_json(p.*) as products FROM recipe_ingredients ri
     LEFT JOIN products p ON ri.product_id = p.id
     WHERE ri.recipe_id = $1 ORDER BY ri.created_at`, [recipeId]
  );
  res.json(rows);
});

r.post("/batch", async (req, res) => {
  const { recipeId, ingredients } = req.body;
  const toDelete = ingredients.filter((i: any) => i.id && i._deleted);
  const existing = ingredients.filter((i: any) => i.id && !i._deleted);
  const toInsert = ingredients.filter((i: any) => !i.id && !i._deleted);

  for (const i of toDelete) await query("DELETE FROM recipe_ingredients WHERE id=$1", [i.id]);
  for (const i of existing) {
    await query("UPDATE recipe_ingredients SET product_id=$1, name=$2, quantity=$3, unit=$4, is_staple=$5 WHERE id=$6",
      [i.product_id, i.product_name, Number(i.quantity) || 1, i.unit, i.is_staple, i.id]);
  }
  for (const i of toInsert) {
    await query("INSERT INTO recipe_ingredients (recipe_id, product_id, name, quantity, unit, is_staple) VALUES ($1,$2,$3,$4,$5,$6)",
      [recipeId, i.product_id, i.product_name, Number(i.quantity) || 1, i.unit, i.is_staple]);
  }
  res.json({ ok: true });
});

export { r as recipeIngredientsRouter };
