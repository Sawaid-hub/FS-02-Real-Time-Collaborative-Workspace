"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface SearchItem {
  id: string;
  type: "doc" | "project" | "task" | "member";
  title: string;
  subtitle?: string;
  url?: string;
  badge?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: SearchItem[];
  onSelectItem?: (item: SearchItem) => void;
}

export function CommandPalette({ isOpen, onClose, items, onSelectItem }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleSelect(item: SearchItem) {
    if (onSelectItem) {
      onSelectItem(item);
    } else if (item.url) {
      router.push(item.url);
    }
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-dialog"
        style={{
          maxWidth: 580,
          borderRadius: 16,
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.25)",
          padding: 0,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--affine-border)",
            gap: 12,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--affine-muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search docs, tasks, projects, or team..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "1rem",
              background: "transparent",
              color: "var(--affine-ink)",
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                  prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
                );
              } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
                e.preventDefault();
                handleSelect(filteredItems[selectedIndex]);
              }
            }}
          />
          <kbd
            style={{
              fontSize: "0.75rem",
              background: "var(--affine-border-subtle)",
              color: "var(--affine-muted)",
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid var(--affine-border)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 8 }}>
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "var(--affine-muted)",
                fontSize: "0.9rem",
              }}
            >
              No matching items found for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isSelected ? "var(--affine-primary-subtle)" : "transparent",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ color: "var(--affine-muted)", display: "flex", alignItems: "center" }}>
                      {item.type === "doc" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      ) : item.type === "project" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      ) : item.type === "task" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: isSelected ? "var(--affine-primary)" : "var(--affine-ink)",
                        }}
                      >
                        {item.title}
                      </div>
                      {item.subtitle ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--affine-muted)" }}>
                          {item.subtitle}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "var(--affine-border-subtle)",
                      color: "var(--affine-muted)",
                    }}
                  >
                    {item.badge || item.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Footer Hints */}
        <div
          style={{
            padding: "8px 16px",
            background: "var(--affine-sidebar-bg)",
            borderTop: "1px solid var(--affine-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "var(--affine-muted)",
          }}
        >
          <span>Use ↑↓ arrows to navigate, Enter to select</span>
          <span>{filteredItems.length} items</span>
        </div>
      </div>
    </div>
  );
}
