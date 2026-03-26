import { Router } from "express";
import { query } from "../db.js";
const r = Router();

r.get("/", async (_req, res) => { res.json(await query("SELECT * FROM item_categories ORDER BY sort_order")); });
r.post("/", async (req, res) => {
  const { name, sort_order } = req.body;
  res.json(await query("INSERT INTO item_categories (name, sort_order) VALUES ($1,$2) RETURNING *", [name, sort_order || 0]));
});
r.patch("/:id", async (req, res) => {
  const { name, sort_order } = req.body;
  await query("UPDATE item_categories SET name=COALESCE($1,name), sort_order=COALESCE($2,sort_order) WHERE id=$3", [name, sort_order, req.params.id]);
  res.json({ ok: true });
});
r.delete("/:id", async (req, res) => { await query("DELETE FROM item_categories WHERE id=$1", [req.params.id]); res.json({ ok: true }); });

export { r as itemCategoriesRouter };
