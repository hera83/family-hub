import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import CalendarPage from "./pages/CalendarPage";
import MealPlanPage from "./pages/MealPlanPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import OrdersPage from "./pages/OrdersPage";
import RecipesPage from "./pages/RecipesPage";
import CookRecipePage from "./pages/CookRecipePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { isDatabaseEmpty, seedDemoData } from "@/lib/demoSeed";

const queryClient = new QueryClient();

function AutoSeed() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    isDatabaseEmpty().then((empty) => {
      if (empty) {
        console.log("[AutoSeed] Database is empty, seeding demo data...");
        seedDemoData().then(() => {
          console.log("[AutoSeed] Demo data seeded.");
          queryClient.invalidateQueries();
        });
      }
    });
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AutoSeed />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/kalender" element={<CalendarPage />} />
            <Route path="/madplan" element={<MealPlanPage />} />
            <Route path="/indkoebsliste" element={<ShoppingListPage />} />
            <Route path="/ordrer" element={<OrdersPage />} />
            <Route path="/opskrifter" element={<RecipesPage />} />
            <Route path="/cook/:recipeId" element={<CookRecipePage />} />
            <Route path="/indstillinger" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
