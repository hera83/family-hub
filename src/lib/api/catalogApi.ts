import { api } from "./client";
import type { Product, ItemCategory } from "./types";

export const catalogApi = {
  // ── Item categories ──
  getItemCategories: () =>
    api.get<ItemCategory[]>("/api/v1/catalog/categories"),

  createItemCategory: (cat: { name: string; sort_order: number }) =>
    api.post<ItemCategory>("/api/v1/catalog/categories", cat),

  updateItemCategory: (id: string, data: Partial<ItemCategory>) =>
    api.put<ItemCategory>(`/api/v1/catalog/categories/${id}`, data),

  deleteItemCategory: (id: string) =>
    api.delete(`/api/v1/catalog/categories/${id}`),

  // ── Products ──
  getProducts: () =>
    api.get<Product[]>("/api/v1/catalog/products"),

  createProduct: (product: Partial<Product>) =>
    api.post<Product>("/api/v1/catalog/products", product),

  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/api/v1/catalog/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete(`/api/v1/catalog/products/${id}`),

  getTopProducts: () =>
    api.get<string[]>("/api/v1/catalog/products/top"),
};
