import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

r.get("/all", async (_req, res) => {
  const rows = await query("SELECT * FROM meal_plans ORDER BY week_start, day_of_week");
  res.json(rows);
});

r.get("/", async (req, res) => {
  const { weekStart } = req.query;
  const rows = await query(
    `SELECT mp.*, row_to_json(r.*) as recipes FROM meal_plans mp
     LEFT JOIN recipes r ON mp.recipe_id = r.id
     WHERE mp.week_start = $1 ORDER BY mp.day_of_week`, [weekStart]
  );
  res.json(rows);
});

r.post("/", async (req, res) => {
  const { day_of_week, recipe_id, week_start, plan_date } = req.body;
  const row = await queryOne(
    "INSERT INTO meal_plans (day_of_week, recipe_id, week_start, plan_date) VALUES ($1,$2,$3,$4) RETURNING *",
    [day_of_week, recipe_id, week_start, plan_date]
  );
  res.json(row);
});

r.patch("/:id", async (req, res) => {
  const fields = req.body; const id = req.params.id;
  const sets = Object.keys(fields).map((k, i) => `${k}=$${i + 1}`).join(",");
  const vals = [...Object.values(fields), id];
  await query(`UPDATE meal_plans SET ${sets} WHERE id=$${vals.length}`, vals);
  res.json({ ok: true });
});

r.delete("/:id", async (req, res) => {
  await query("DELETE FROM meal_plans WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export { r as mealPlansRouter };
