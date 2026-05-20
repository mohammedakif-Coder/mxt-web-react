import { useState } from "react";
import { Outlet } from "react-router-dom";
import AIPanel from "@/features/ai/components/AIPanel";
import { AIPanelProvider, useAIPanel } from "@/contexts/AIPanelContext";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";

function LayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { open, openPanel, closePanel, setMode } = useAIPanel();

  const handleHeaderToggleAI = () => {
    if (open) {
      closePanel();
    } else {
      setMode("chat");
      openPanel("chat");
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <DashboardHeader onToggleAIPanel={handleHeaderToggleAI} aiPanelOpen={open} />
      <div className="flex flex-1 overflow-hidden">
        <div className="dark bg-sidebar text-sidebar-foreground">
          <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 overflow-auto p-5 scrollbar-thin">
          <Outlet />
        </main>
        <AIPanel open={open} onClose={closePanel} />
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <AIPanelProvider>
      <LayoutInner />
    </AIPanelProvider>
  );
}
