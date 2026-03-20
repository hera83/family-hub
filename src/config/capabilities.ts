/**
 * Backend capability flags.
 * Each feature area is either "active" (API endpoints exist) or "pending" (awaiting API).
 * UI uses these to show informative placeholders for pending features.
 */
export const capabilities = {
  calendar: true,
  recipes: true,
  catalogLookups: true,
  orders: true,
  mealPlan: false,
  shoppingList: false,
  imageUpload: false,
} as const;

export type FeatureKey = keyof typeof capabilities;

export function isFeatureActive(key: FeatureKey): boolean {
  return capabilities[key];
}
