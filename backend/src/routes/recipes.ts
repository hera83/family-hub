import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

r.get("/", async (_req, res) => {
  res.json(await query("SELECT * FROM recipes ORDER BY title"));
});

r.get("/paginated", async (req, res) => {
  const { search, category, page = "1", pageSize = "10" } = req.query as any;
  const p = parseInt(page); const ps = parseInt(pageSize);
  let where = "WHERE 1=1";
  const params: any[] = [];
  if (category) { params.push(category); where += ` AND category = $${params.length}`; }
  if (search) { params.push(`%${search}%`); where += ` AND title ILIKE $${params.length}`; }
  const countRes = await query(`SELECT COUNT(*) as total FROM recipes ${where}`, params);
  const total = parseInt(countRes[0].total);
  params.push(ps); params.push((p - 1) * ps);
  const recipes = await query(`SELECT * FROM recipes ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json({ recipes, total });
});

r.get("/:id", async (req, res) => {
  res.json(await queryOne("SELECT * FROM recipes WHERE id=$1", [req.params.id]));
});

r.post("/", async (req, res) => {
  const { title, image_url, description, category, prep_time, wait_time, instructions, is_manual, is_favorite } = req.body;
  const row = await queryOne(
    `INSERT INTO recipes (title,image_url,description,category,prep_time,wait_time,instructions,is_manual,is_favorite)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [title, image_url, description, category, prep_time, wait_time, instructions, is_manual ?? true, is_favorite ?? false]
  );
  res.json(row);
});

r.patch("/:id", async (req, res) => {
  const fields = req.body; const id = req.params.id;
  const sets = Object.keys(fields).map((k, i) => `${k}=$${i + 1}`).join(",");
  const vals = Object.values(fields);
  vals.push(id);
  await query(`UPDATE recipes SET ${sets}, updated_at=now() WHERE id=$${vals.length}`, vals);
  res.json({ ok: true });
});

r.delete("/:id", async (req, res) => {
  await query("DELETE FROM recipe_ingredients WHERE recipe_id=$1", [req.params.id]);
  await query("DELETE FROM recipes WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export { r as recipesRouter };
