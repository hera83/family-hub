import { Router } from "express";
import { query, queryOne } from "../db.js";
const r = Router();

r.get("/", async (req, res) => {
  const { type, start, end } = req.query;
  if (type === "normal") {
    const rows = await query(
      `SELECT ce.*, row_to_json(fm.*) as family_members FROM calendar_events ce
       LEFT JOIN family_members fm ON ce.member_id = fm.id
       WHERE ce.recurrence_type IS NULL AND ce.event_date >= $1 AND ce.event_date <= $2
       ORDER BY ce.start_time`, [start, end]
    );
    res.json(rows);
  } else if (type === "recurring") {
    const rows = await query(
      `SELECT ce.*, row_to_json(fm.*) as family_members FROM calendar_events ce
       LEFT JOIN family_members fm ON ce.member_id = fm.id
       WHERE ce.recurrence_type IS NOT NULL AND ce.event_date <= $1
       ORDER BY ce.start_time`, [end]
    );
    res.json(rows);
  } else {
    const rows = await query("SELECT * FROM calendar_events ORDER BY event_date, start_time");
    res.json(rows);
  }
});

r.post("/", async (req, res) => {
  const { title, description, event_date, start_time, end_time, member_id, recurrence_type, recurrence_days } = req.body;
  const row = await queryOne(
    `INSERT INTO calendar_events (title, description, event_date, start_time, end_time, member_id, recurrence_type, recurrence_days)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [title, description, event_date, start_time, end_time, member_id, recurrence_type, recurrence_days]
  );
  res.json(row);
});

r.patch("/:id", async (req, res) => {
  const { title, description, event_date, start_time, end_time, member_id, recurrence_type, recurrence_days } = req.body;
  await query(
    `UPDATE calendar_events SET title=COALESCE($1,title), description=$2, event_date=COALESCE($3,event_date),
     start_time=$4, end_time=$5, member_id=$6, recurrence_type=$7, recurrence_days=$8 WHERE id=$9`,
    [title, description, event_date, start_time, end_time, member_id, recurrence_type, recurrence_days, req.params.id]
  );
  res.json({ ok: true });
});

r.delete("/:id", async (req, res) => {
  await query("DELETE FROM calendar_events WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export { r as calendarRouter };
