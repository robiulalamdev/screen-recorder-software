import { useEffect } from "react";
import { useSettings } from "../stores/settingsStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");

    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.add("light");
    }
    // "system" = no class added, uses @media query
  }, [settings.theme]);

  return <>{children}</>;
}
