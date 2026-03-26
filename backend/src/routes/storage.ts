import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
const r = Router();

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const folder = (_req.query.folder as string) || "uploads";
    const dir = path.join(uploadDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

r.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const folder = (req.query.folder as string) || "uploads";
  const url = `/${uploadDir}/${folder}/${req.file.filename}`;
  res.json({ url });
});

export { r as storageRouter };
