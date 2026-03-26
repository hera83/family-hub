import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool, initDb } from "./db.js";
import { calendarRouter } from "./routes/calendar.js";
import { familyMembersRouter } from "./routes/familyMembers.js";
import { recipesRouter } from "./routes/recipes.js";
import { recipeCategoriesRouter } from "./routes/recipeCategories.js";
import { recipeIngredientsRouter } from "./routes/recipeIngredients.js";
import { mealPlansRouter } from "./routes/mealPlans.js";
import { shoppingListRouter } from "./routes/shoppingList.js";
import { productsRouter } from "./routes/products.js";
import { itemCategoriesRouter } from "./routes/itemCategories.js";
import { ordersRouter } from "./routes/orders.js";
import { orderLinesRouter } from "./routes/orderLines.js";
import { storageRouter } from "./routes/storage.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Optional API key auth
const API_KEY = process.env.API_KEY;
if (API_KEY) {
  app.use("/api", (req, res, next) => {
    const key = req.headers["x-api-key"];
    if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
    next();
  });
}

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/family-members", familyMembersRouter);
app.use("/api/calendar-events", calendarRouter);
app.use("/api/recipes", recipesRouter);
app.use("/api/recipe-categories", recipeCategoriesRouter);
app.use("/api/recipe-ingredients", recipeIngredientsRouter);
app.use("/api/meal-plans", mealPlansRouter);
app.use("/api/shopping-list", shoppingListRouter);
app.use("/api/products", productsRouter);
app.use("/api/item-categories", itemCategoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/order-lines", orderLinesRouter);
app.use("/api/storage", storageRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

async function start() {
  await initDb();
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

start().catch(console.error);
