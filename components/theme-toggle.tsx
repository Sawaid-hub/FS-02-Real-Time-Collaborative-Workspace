"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("affine-theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("affine-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: "var(--affine-sidebar-hover, rgba(0, 0, 0, 0.04))",
        border: "1px solid var(--affine-border, #e2e8f0)",
        borderRadius: "var(--radius-md, 8px)",
        cursor: "pointer",
        fontSize: "0.95rem",
        padding: "6px 10px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: "var(--affine-ink, #0f172a)",
        transition: "var(--transition, all 0.15s ease)",
        ...style,
      }}
    >
      <span>{theme === "dark" ? "☀️" : "🌙"}</span>
      <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>
        {theme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
