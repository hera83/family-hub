import { api } from "./client";
import type { MealPlan } from "./types";

export const mealPlanApi = {
  getByWeek: (weekStart: string) =>
    api.get<MealPlan[]>("/api/meal-plans", {
      params: { week_start: weekStart },
    }),

  set: (data: {
    day_of_week: number;
    recipe_id: string | null;
    week_start: string;
    plan_date: string;
  }) =>
    api.post<MealPlan>("/api/meal-plans", data),

  update: (id: string, data: Partial<MealPlan>) =>
    api.patch<MealPlan>(`/api/meal-plans/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/meal-plans/${id}`),

  swap: (params: {
    from_id: string;
    to_id?: string;
    from_day: number;
    to_day: number;
    week_start: string;
  }) =>
    api.post("/api/meal-plans/swap", params),

  getOrderStatus: (mealPlanIds: string[]) =>
    api.post<Record<string, { total: number; ordered: number; latestOrderedAt: string | null }>>(
      "/api/meal-plans/order-status",
      { ids: mealPlanIds }
    ),
};
