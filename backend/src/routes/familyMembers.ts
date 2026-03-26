import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

r.get("/", async (_req, res) => {
  const rows = await query("SELECT * FROM family_members ORDER BY created_at");
  res.json(rows);
});
r.post("/", async (req, res) => {
  const { name, color } = req.body;
  const row = await queryOne("INSERT INTO family_members (name, color) VALUES ($1, $2) RETURNING *", [name, color]);
  res.json(row);
});
r.patch("/:id", async (req, res) => {
  const { name, color } = req.body;
  await query("UPDATE family_members SET name=COALESCE($1,name), color=COALESCE($2,color) WHERE id=$3", [name, color, req.params.id]);
  res.json({ ok: true });
});
r.delete("/:id", async (req, res) => {
  await query("DELETE FROM family_members WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export { r as familyMembersRouter };
