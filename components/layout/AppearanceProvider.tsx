"use client";

import { useEffect } from "react";
import { getFontOption } from "@/lib/fonts";
import { useUIStore } from "@/store/uiStore";
import { Toast } from "@/components/feedback/Toast";

function applyTheme(theme: "light" | "dark" | "auto") {
  const dark =
    theme === "dark" ||
    (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.settings.theme);
  const font = useUIStore((s) => s.settings.font);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "auto") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("auto");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    const option = getFontOption(font);
    document.documentElement.style.setProperty("--font-app", `var(${option.cssVar})`);
  }, [font]);

  return (
    <>
      {children}
      <Toast />
    </>
  );
}
