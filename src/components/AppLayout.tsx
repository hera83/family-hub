import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useTouchMode } from "@/hooks/useTouchMode";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VirtualKeyboard } from "@/components/VirtualKeyboard";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isTouchMode, isDimmed, resetTimer } = useTouchMode();
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-background shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground">Familiens Assistent</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="min-h-[44px] min-w-[44px]">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {isDimmed && (
        <div className="dim-overlay" onClick={resetTimer} onTouchStart={resetTimer} />
      )}

      <VirtualKeyboard enabled={isTouchMode} />
    </SidebarProvider>
  );
}
