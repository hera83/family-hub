import { Router } from "express";
import { query } from "../db.js";
const r = Router();

// Also handle order_lines creation
r.post("/", async (req, res) => {
  const lines = req.body; // array
  for (const l of lines) {
    await query(
      "INSERT INTO order_lines (order_id, product_name, quantity, unit, category_name, price, size_label) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [l.order_id, l.product_name, l.quantity, l.unit, l.category_name, l.price, l.size_label]
    );
  }
  res.json({ ok: true });
});

// Mount at /api/order-lines
export { r as orderLinesRouter };
