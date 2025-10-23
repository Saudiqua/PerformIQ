import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    if (user?.theme) {
      setThemeState(user.theme);
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    if (user) {
      try {
        await apiRequest("PATCH", "/api/user/theme", { theme: newTheme });
      } catch (error) {
        console.error("Failed to update theme preference:", error);
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
