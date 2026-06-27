import { useEffect, useState } from "react";
import { AppSidebar } from "./components/sidebar";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { NewsPage } from "./pages/news";
import "./App.css";
import { TooltipProvider } from "./components/ui/tooltip";
import { RecommendPage } from "./pages/recommend";
import { ManagePage } from "./pages/manage";
import { AboutPage } from "./pages/about";
import { SettingsPage } from "./pages/settings";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { toast } from "sonner";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useQueryClient } from "@tanstack/react-query";
import { useSources } from "./hooks/sourcehooks";
import { useCategories } from "./hooks/categoryhooks";

export type Page = "news" | "recommend" | "manage" | "settings" | "about";

function App() {
  useSources(); // populate sources cache
  useCategories(); // populate categories cache
  const [page, setPage] = useState<Page>("news");
  const queryClient = useQueryClient();
  useEffect(() => {
    const news_listener = listen<[string, number]>(
      "news_updated",
      async ({ payload }) => {
        const [sourceId, numberOfNews] = payload;
        queryClient.invalidateQueries({ queryKey: ["news"] });
        if (localStorage.getItem("notifications") !== "true") {
          return;
        }

        if (await getCurrentWindow().isFocused()) {
          toast.info(
            `${numberOfNews} new articles from source ${sourceId} have been fetched`,
          );
          return;
        }
        let permission = await isPermissionGranted();
        if (!permission) {
          permission = (await requestPermission()) === "granted";
        }

        if (permission) {
          sendNotification({
            title: "News fetched",
            body: `${sourceId} has ${numberOfNews} news to read.`,
          });
        }
      },
    );
    return () => {
      news_listener.then((unlisten) => unlisten());
    };
  }, [queryClient]);

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
            <AppSidebar
              page={page}
              setPage={setPage}
              variant="sidebar"
              className="select-none"
            />

            <SidebarInset className="min-w-0">
              {page === "news" && <NewsPage />}
              {page === "recommend" && <RecommendPage />}
              {page === "manage" && <ManagePage />}
              {page === "settings" && <SettingsPage />}
              {page === "about" && <AboutPage />}
            </SidebarInset>
          </SidebarProvider>
        </main>
      </div>
    </TooltipProvider>
  );
}
export default App;
