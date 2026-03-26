import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

r.get("/", async (_req, res) => { res.json(await query("SELECT * FROM recipe_categories ORDER BY sort_order")); });
r.post("/", async (req, res) => {
  const { name, sort_order } = req.body;
  res.json(await queryOne("INSERT INTO recipe_categories (name, sort_order) VALUES ($1,$2) RETURNING *", [name, sort_order || 0]));
});
r.patch("/:id", async (req, res) => {
  const { name, sort_order } = req.body;
  await query("UPDATE recipe_categories SET name=COALESCE($1,name), sort_order=COALESCE($2,sort_order) WHERE id=$3", [name, sort_order, req.params.id]);
  res.json({ ok: true });
});
r.delete("/:id", async (req, res) => { await query("DELETE FROM recipe_categories WHERE id=$1", [req.params.id]); res.json({ ok: true }); });
r.post("/rename-on-recipes", async (req, res) => {
  await query("UPDATE recipes SET category=$1 WHERE category=$2", [req.body.newName, req.body.oldName]);
  res.json({ ok: true });
});
r.post("/clear-on-recipes", async (req, res) => {
  await query("UPDATE recipes SET category=NULL WHERE category=$1", [req.body.categoryName]);
  res.json({ ok: true });
});

export { r as recipeCategoriesRouter };
