import { FeaturePending } from "@/components/FeaturePending";
import { isFeatureActive } from "@/config/capabilities";
import MealPlanPageFull from "@/pages/MealPlanPageFull";

export default function MealPlanPage() {
  if (!isFeatureActive("mealPlan")) {
    return (
      <FeaturePending
        title="Madplan"
        description="Madplanlægning afventer API-understøttelse. Når endpointet er klar, kan du igen planlægge ugens måltider, synkronisere med indkøbslisten og bruge drag-and-swap."
      />
    );
  }
  return <MealPlanPageFull />;
}
