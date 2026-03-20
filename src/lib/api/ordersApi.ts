import { api } from "./client";
import type { Order, OrderLine } from "./types";

export const ordersApi = {
  getAll: () =>
    api.get<Order[]>("/api/orders"),

  getById: (id: string) =>
    api.get<Order>(`/api/orders/${id}`),

  create: (order: {
    status: string;
    total_items: number;
    total_price: number;
    pdf_data?: string | null;
    lines: Array<{
      product_name: string;
      quantity: number;
      unit: string;
      category_name: string;
      price: number | null;
      size_label: string | null;
    }>;
  }) =>
    api.post<Order>("/api/orders", order),

  delete: (id: string) =>
    api.delete(`/api/orders/${id}`),
};
