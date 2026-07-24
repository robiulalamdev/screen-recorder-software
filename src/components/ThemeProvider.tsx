import { useLayoutEffect } from "react";
import { useSettings } from "../stores/settingsStore";
import { applyTheme } from "../theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useLayoutEffect(() => {
    if (settings.theme === "dark") {
      applyTheme("dark");
    } else if (settings.theme === "light") {
      applyTheme("light");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }, [settings.theme]);

  return <>{children}</>;
}
