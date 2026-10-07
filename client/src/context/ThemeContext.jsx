import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("devcollab_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("devcollab_theme", theme);
    window.dispatchEvent(new Event("devcollab_theme_change"));
  }, [theme]);

  // Listen for external theme changes (from Navbar etc.)
  useEffect(() => {
    const handleThemeChange = () => {
      const stored = localStorage.getItem("devcollab_theme") || "dark";
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    };
    window.addEventListener("devcollab_theme_change", handleThemeChange);
    return () => window.removeEventListener("devcollab_theme_change", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
