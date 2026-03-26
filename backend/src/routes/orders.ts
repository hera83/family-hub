import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

r.get("/", async (_req, res) => { res.json(await query("SELECT * FROM orders ORDER BY created_at DESC")); });

r.post("/", async (req, res) => {
  const { status, total_items, total_price, pdf_data, notes } = req.body;
  const row = await queryOne(
    "INSERT INTO orders (status, total_items, total_price, pdf_data, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [status || "pending", total_items || 0, total_price, pdf_data, notes]
  );
  res.json(row);
});

r.delete("/:id", async (req, res) => {
  await query("DELETE FROM order_lines WHERE order_id=$1", [req.params.id]);
  await query("DELETE FROM orders WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

r.get("/top-products", async (_req, res) => {
  const rows = await query("SELECT product_name, COUNT(*) as cnt FROM order_lines GROUP BY product_name ORDER BY cnt DESC LIMIT 6");
  res.json(rows.map((r: any) => r.product_name));
});

export { r as ordersRouter };
