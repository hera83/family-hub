import { api } from "./client";
import type { Product, ItemCategory } from "./types";

export const catalogApi = {
  // ── Item categories ──
  getItemCategories: () =>
    api.get<ItemCategory[]>("/api/item-categories"),

  createItemCategory: (cat: { name: string; sort_order: number }) =>
    api.post<ItemCategory>("/api/item-categories", cat),

  updateItemCategory: (id: string, data: Partial<ItemCategory>) =>
    api.patch<ItemCategory>(`/api/item-categories/${id}`, data),

  deleteItemCategory: (id: string) =>
    api.delete(`/api/item-categories/${id}`),

  // ── Products ──
  getProducts: () =>
    api.get<Product[]>("/api/products"),

  createProduct: (product: Partial<Product>) =>
    api.post<Product>("/api/products", product),

  updateProduct: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/api/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete(`/api/products/${id}`),

  getTopProducts: () =>
    api.get<string[]>("/api/products/top"),
};
