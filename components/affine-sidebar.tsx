"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Role } from "@prisma/client";
import { SignOutButton } from "@/components/sign-out-button";

export interface SidebarDocItem {
  id: string;
  title: string;
}

interface AffineSidebarProps {
  workspaceId: string;
  workspaceName: string;
  role: Role;
  isOwner: boolean;
  activeNav: "docs" | "projects" | "tasks" | "team";
  onSelectNav: (nav: "docs" | "projects" | "tasks" | "team") => void;
  docs: SidebarDocItem[];
  docsCount: number;
  projectsCount: number;
  tasksCount: number;
  membersCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewDoc?: () => void;
  onOpenSearch?: () => void;
  userName?: string;
  userEmail?: string;
}

export function AffineSidebar({
  workspaceId,
  workspaceName,
  role,
  isOwner,
  activeNav,
  onSelectNav,
  docs,
  docsCount,
  projectsCount,
  tasksCount,
  membersCount,
  isCollapsed = false,
  onToggleCollapse,
  onNewDoc,
  onOpenSearch,
  userName = "User",
  userEmail = "",
}: AffineSidebarProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("affine-theme");
    if (saved === "light") {
      setIsDark(false);
      document.documentElement.removeAttribute("data-theme");
    } else {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("affine-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("affine-theme", "light");
    }
  }

  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [workspacesList, setWorkspacesList] = useState<{ id: string; name: string }[]>([]);
  const [newWsName, setNewWsName] = useState("");
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  async function handleOpenWsDropdown() {
    const nextState = !isWsDropdownOpen;
    setIsWsDropdownOpen(nextState);
    if (nextState && workspacesList.length === 0) {
      try {
        const res = await fetch("/api/workspaces");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.workspaces)) {
            setWorkspacesList(data.workspaces.map((w: { id: string; name: string }) => ({ id: w.id, name: w.name })));
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
  }

  async function handleCreateQuickWs(e: React.FormEvent) {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setIsCreatingWs(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newWsName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.workspace?.id) {
          window.location.href = `/w/${data.workspace.id}`;
        }
      }
    } finally {
      setIsCreatingWs(false);
    }
  }

  if (isCollapsed) return null;

  return (
    <aside className="affine-sidebar">
      <div>
        {/* Top Notion Icons Header: ◨ on left, ✉ and ✎ on right */}
        <div style={{ padding: "10px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            style={{
              background: "transparent",
              border: "none",
              color: "#888888",
              fontSize: "1.1rem",
              cursor: "pointer",
              padding: "2px 5px",
              borderRadius: 4,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#ffffff";
              (e.currentTarget as HTMLElement).style.background = "#282828";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#888888";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            ◨
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => onSelectNav("team")}
              title="Inbox / notifications"
              style={{
                background: "transparent",
                border: "none",
                color: "#888888",
                fontSize: "0.95rem",
                cursor: "pointer",
                padding: "2px 5px",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
                (e.currentTarget as HTMLElement).style.background = "#282828";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#888888";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onNewDoc}
              title="New page / chat"
              style={{
                background: "transparent",
                border: "none",
                color: "#888888",
                fontSize: "0.95rem",
                cursor: "pointer",
                padding: "2px 5px",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
                (e.currentTarget as HTMLElement).style.background = "#282828";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#888888";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search or Ask Pill Input (matching screenshot) */}
        <div style={{ padding: "8px 12px 6px" }}>
          <button
            type="button"
            onClick={onOpenSearch}
            style={{
              width: "100%",
              background: "#242424",
              border: "1px solid #333333",
              borderRadius: "9999px",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#444444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#333333";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#8c8c8c", fontSize: "0.82rem" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search or ask</span>
            </div>
            <kbd
              style={{
                fontSize: "0.68rem",
                background: "#2c2c2c",
                border: "1px solid #383838",
                padding: "1px 5px",
                borderRadius: 4,
                color: "#999999",
              }}
            >
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Primary Notion Navigation (Home, Chat, Calendar, Library) */}
        <div style={{ padding: "4px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          <button
            type="button"
            onClick={() => onSelectNav("docs")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderRadius: 6,
              background: activeNav === "docs" ? "#282828" : "transparent",
              border: "none",
              color: activeNav === "docs" ? "#ffffff" : "#b0b0b0",
              fontSize: "0.84rem",
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#777" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </button>

          <button
            type="button"
            onClick={onNewDoc}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 6,
              background: "transparent",
              border: "none",
              color: "#b0b0b0",
              fontSize: "0.84rem",
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#242424";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span>+</span>
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectNav("projects")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 6,
              background: activeNav === "projects" ? "#282828" : "transparent",
              border: "none",
              color: activeNav === "projects" ? "#ffffff" : "#b0b0b0",
              fontSize: "0.84rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Library</span>
          </button>
        </div>

        {/* Section: Upcoming events (from screenshot) */}
        <div style={{ padding: "12px 10px 4px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Upcoming events
          </div>
          <button
            type="button"
            onClick={() => onSelectNav("tasks")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 6,
              background: "transparent",
              border: "none",
              color: "#999",
              fontSize: "0.82rem",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Connect your calendar</span>
          </button>
        </div>

        {/* Section: Shared (from screenshot: Video Editing Deadlines highlighted) */}
        <div style={{ padding: "12px 10px 4px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Shared
          </div>
          <button
            type="button"
            onClick={() => onSelectNav("docs")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              borderRadius: 6,
              background: activeNav === "docs" ? "#282828" : "transparent",
              border: "none",
              color: activeNav === "docs" ? "#ffffff" : "#cccccc",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {workspaceName === "Demo Workspace" ? "Video Editing Deadlines" : workspaceName}
            </span>
          </button>

          {docs.length > 0 ? (
            <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
              {docs.slice(0, 6).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/w/${workspaceId}/p/${doc.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 10px",
                    borderRadius: 6,
                    color: "#999999",
                    fontSize: "0.8rem",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#242424";
                    (e.currentTarget as HTMLElement).style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#999999";
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.title || "Untitled"}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* Section: Private */}
        <div style={{ padding: "10px 10px 4px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            Private
          </div>
          <button
            type="button"
            onClick={onNewDoc}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 8px",
              borderRadius: 6,
              background: "transparent",
              border: "none",
              color: "#777",
              fontSize: "0.82rem",
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#ccc";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#777";
            }}
          >
            <span>+</span>
            <span>Add new</span>
          </button>
        </div>
      </div>

      {/* Footer (from screenshot: Customize sidebar & User Profile) */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #282828", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={() => onSelectNav("team")}
          style={{
            background: "none",
            border: "none",
            color: "#777",
            fontSize: "0.78rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            padding: "2px 4px",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Customize sidebar</span>
        </button>

        {/* User Profile Row: [S] SAWAID OP's... ▾ (matching screenshot) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 8px",
            borderRadius: 6,
            background: "#242424",
            border: "1px solid #333333",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={handleOpenWsDropdown}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflow: "hidden",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              padding: 0,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: "linear-gradient(135deg, #1e96eb, #7c3aed)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              S
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              SAWAID OP's...
            </div>
            <span style={{ fontSize: "0.7rem", color: "#888" }}>▾</span>
          </button>

          {/* Workspace Switcher Dropdown (Positioned above footer) */}
          {isWsDropdownOpen ? (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: 0,
                right: 0,
                background: "#202020",
                border: "1px solid #383838",
                borderRadius: "var(--radius-md, 8px)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                padding: "8px",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ padding: "4px 8px", fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase" }}>
                Switch Workspace
              </div>

              <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {workspacesList.length > 0 ? (
                  workspacesList.map((ws) => (
                    <Link
                      key={ws.id}
                      href={`/w/${ws.id}`}
                      onClick={() => setIsWsDropdownOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: 6,
                        fontSize: "0.82rem",
                        fontWeight: ws.id === workspaceId ? 600 : 400,
                        color: ws.id === workspaceId ? "#2383e2" : "#f0f0f0",
                        background: ws.id === workspaceId ? "rgba(35, 131, 226, 0.15)" : "transparent",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws.name}</span>
                      </div>
                      {ws.id === workspaceId ? <span>✓</span> : null}
                    </Link>
                  ))
                ) : (
                  <div style={{ padding: "6px 8px", fontSize: "0.8rem", color: "#888" }}>
                    Loading workspaces…
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: "#2e2e2e", margin: "4px 0" }} />

              <form onSubmit={handleCreateQuickWs} style={{ display: "flex", gap: 4, padding: "2px 0" }}>
                <input
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="New workspace…"
                  required
                  style={{
                    flex: 1,
                    fontSize: "0.78rem",
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #383838",
                    background: "#191919",
                    color: "#f0f0f0",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={isCreatingWs}
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: 4,
                    border: "none",
                    background: "#2383e2",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {isCreatingWs ? "…" : "+"}
                </button>
              </form>
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Light mode" : "Dark mode"}
              style={{
                background: "#2a2a2a",
                border: "1px solid #3a3a3a",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.8rem",
                padding: "2px 5px",
                color: "#fff",
              }}
            >
              {isDark ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <SignOutButton compact />
          </div>
        </div>
      </div>
    </aside>
  );
}
