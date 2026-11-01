"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = (mode: typeof theme) => {
      const isDark =
        mode === "dark" ||
        (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    };
    apply(theme);
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const h = () => apply("system");
      mq.addEventListener("change", h);
      return () => mq.removeEventListener("change", h);
    }
  }, [theme]);

  return <>{children}</>;
}
