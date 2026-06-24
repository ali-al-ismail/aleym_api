import { useState } from "react";
import { AppSidebar } from "./components/sidebar";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { NewsPage } from "./pages/news";
import { ThemeProvider } from "next-themes";
import "./App.css";
import { Header } from "./components/header";
import { TooltipProvider } from "./components/ui/tooltip";
import { RecommendPage } from "./pages/recommend";
import { ManagePage } from "./pages/manage";
import { AboutPage } from "./pages/about";
import { SettingsPage } from "./pages/settings";

export type Page = "news" | "recommend" | "manage" | "settings" | "about";

function App() {
  const [page, setPage] = useState<Page>("news");
  return (
    <TooltipProvider>
      <div className="flex h-screen min-w-0">
        <main className="min-w-0 flex-1 overflow-auto">
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 56)",
                "--header-height": "calc(var(--spacing) * 15)",
              } as React.CSSProperties
            }
          >
            <AppSidebar page={page} setPage={setPage} variant="sidebar" />

            <SidebarInset className="min-w-0">
              {(page === "recommend" || page === "news") && <Header />}
              <div className="">
                {page === "news" && <NewsPage />}
                {page === "recommend" && <RecommendPage />}
                {page === "manage" && <ManagePage />}
                {page === "settings" && <SettingsPage />}
                {page === "about" && <AboutPage />}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </main>
      </div>
    </TooltipProvider>
  );
}
export default App;
