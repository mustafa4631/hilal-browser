"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center opacity-0"
        aria-label="Tema Değiştir"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-all duration-200 cursor-pointer"
      aria-label="Tema Değiştir"
    >
      <div className="transition-opacity duration-200">
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </div>
    </button>
  );
}
