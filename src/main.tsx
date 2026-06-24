import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ColorThemeProvider } from "@/components/color-theme-provider";
import { ThemeScript } from "@/components/theme-script";
import {
  THEMES,
  DEFAULT_THEME,
  BASE_COLORS,
  DEFAULT_BASE_COLOR,
} from "@/lib/themes";

import App from "./App";

ThemeScript();
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ColorThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        colorThemes={THEMES}
        defaultColor={DEFAULT_THEME}
        baseColors={BASE_COLORS}
        defaultBaseColor={DEFAULT_BASE_COLOR}
      >
        <App />
      </ColorThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
