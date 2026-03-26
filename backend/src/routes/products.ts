import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

r.get("/", async (_req, res) => {
  const rows = await query(
    `SELECT p.*, row_to_json(ic.*) as item_categories FROM products p
     LEFT JOIN item_categories ic ON p.category_id = ic.id ORDER BY p.name`
  );
  res.json(rows);
});

r.post("/", async (req, res) => {
  const b = req.body;
  const row = await queryOne(
    `INSERT INTO products (name,unit,category_id,is_manual,description,size_label,price,image_url,is_favorite,is_staple,
     calories_per_100g,fat_per_100g,carbs_per_100g,protein_per_100g,fiber_per_100g)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [b.name, b.unit, b.category_id, b.is_manual ?? true, b.description, b.size_label, b.price,
     b.image_url, b.is_favorite ?? false, b.is_staple ?? false,
     b.calories_per_100g, b.fat_per_100g, b.carbs_per_100g, b.protein_per_100g, b.fiber_per_100g]
  );
  res.json(row);
});

r.patch("/:id", async (req, res) => {
  const fields = req.body; const id = req.params.id;
  const sets = Object.keys(fields).map((k, i) => `${k}=$${i + 1}`).join(",");
  const vals = [...Object.values(fields), id];
  await query(`UPDATE products SET ${sets} WHERE id=$${vals.length}`, vals);
  res.json({ ok: true });
});

r.delete("/:id", async (req, res) => {
  await query("DELETE FROM products WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export { r as productsRouter };
