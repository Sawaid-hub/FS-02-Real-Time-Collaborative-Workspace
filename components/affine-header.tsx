"use client";

import { useState } from "react";
import Link from "next/link";
import type { Role } from "@prisma/client";

interface AffineHeaderProps {
  workspaceId: string;
  workspaceName: string;
  title: string;
  role: Role;
  mode?: "page" | "edgeless";
  onModeChange?: (mode: "page" | "edgeless") => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onToggleComments?: () => void;
  onToggleHistory?: () => void;
  onExport?: (format: "md" | "html" | "json") => void;
  commentsCount?: number;
  isCommentsOpen?: boolean;
  isHistoryOpen?: boolean;
  showModeSwitcher?: boolean;
}

export function AffineHeader({
  workspaceId,
  workspaceName,
  title,
  role,
  mode = "page",
  onModeChange,
  isSidebarCollapsed = false,
  onToggleSidebar,
  onToggleComments,
  onToggleHistory,
  onExport,
  commentsCount = 0,
  isCommentsOpen = false,
  isHistoryOpen = false,
  showModeSwitcher = false,
}: AffineHeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowExportMenu(false);
    } catch {
      // Fallback if clipboard permissions blocked
    }
  }

  return (
    <header className="affine-topbar" style={{ position: "relative" }}>
      <div className="affine-topbar-left">
        {isSidebarCollapsed ? (
          <button
            type="button"
            className="affine-quick-btn"
            onClick={onToggleSidebar}
            title="Expand sidebar"
            style={{ fontSize: "1.1rem" }}
          >
            »
          </button>
        ) : null}

        <div className="breadcrumbs" style={{ margin: 0, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
          <span className="current" style={{ color: "#ffffff", fontWeight: 600 }}>
            Video Editing Deadlines
          </span>
        </div>
      </div>

      {showModeSwitcher && onModeChange ? (
        <div className="affine-mode-switcher">
          <button
            type="button"
            className={`affine-mode-btn ${mode === "page" ? "active" : ""}`}
            onClick={() => onModeChange("page")}
            title="Linear document view"
          >
            <span>📄</span>
            <span>Page</span>
          </button>
          <button
            type="button"
            className={`affine-mode-btn ${mode === "edgeless" ? "active" : ""}`}
            onClick={() => onModeChange("edgeless")}
            title="Visual canvas & blocks view"
          >
            <span>🎨</span>
            <span>Edgeless</span>
          </button>
        </div>
      ) : <div />}

      <div className="affine-topbar-right">

        {/* Export / Share Menu */}
        {onExport ? (
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className={`affine-action-icon-btn ${showExportMenu ? "active" : ""}`}
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export or share document"
            >
              <span>📥</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Export</span>
              <span style={{ fontSize: "0.7rem" }}>▾</span>
            </button>

            {showExportMenu ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: 210,
                  background: "var(--affine-card-bg, #ffffff)",
                  border: "1px solid var(--affine-border, #e2e8f0)",
                  borderRadius: "var(--radius-md, 10px)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  padding: "6px",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div style={{ padding: "6px 10px", fontSize: "0.72rem", fontWeight: 700, color: "var(--affine-muted)", textTransform: "uppercase" }}>
                  Export Document
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onExport("md");
                    setShowExportMenu(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    border: "none",
                    background: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    color: "var(--affine-ink)",
                    textAlign: "left",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--affine-sidebar-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "none";
                  }}
                >
                  <span>📝</span>
                  <span>Markdown (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExport("html");
                    setShowExportMenu(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    border: "none",
                    background: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    color: "var(--affine-ink)",
                    textAlign: "left",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--affine-sidebar-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "none";
                  }}
                >
                  <span>🌐</span>
                  <span>HTML Document (.html)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExport("json");
                    setShowExportMenu(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    border: "none",
                    background: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    color: "var(--affine-ink)",
                    textAlign: "left",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--affine-sidebar-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "none";
                  }}
                >
                  <span>📦</span>
                  <span>JSON Snapshot (.json)</span>
                </button>

                <div style={{ height: 1, background: "var(--affine-border-subtle)", margin: "4px 0" }} />

                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    border: "none",
                    background: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    color: "var(--affine-primary)",
                    fontWeight: 600,
                    textAlign: "left",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--affine-primary-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "none";
                  }}
                >
                  <span>🔗</span>
                  <span>{copied ? "Copied to clipboard!" : "Copy Page Link"}</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Edited recently text & Presence Avatars (matches screenshot) */}
        <span style={{ fontSize: "0.78rem", color: "#828282", marginRight: 2 }}>
          Edited 1y ago
        </span>

        <div style={{ display: "flex", alignItems: "center", marginLeft: -2, marginRight: 4 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#333333",
              color: "#ccc",
              fontSize: "0.68rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid #191919",
            }}
            title="Sawaid (Owner)"
          >
            S
          </div>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#444444",
              color: "#ccc",
              fontSize: "0.68rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: -6,
              border: "1.5px solid #191919",
            }}
            title="Member"
          >
            M
          </div>
        </div>

        {/* Share Button */}
        <button
          type="button"
          className="notion-btn-secondary"
          onClick={handleCopyLink}
          title="Share page link"
          style={{ padding: "4px 10px" }}
        >
          <span>{copied ? "Copied!" : "Share"}</span>
        </button>

        {/* Link Button */}
        <button
          type="button"
          className="notion-btn-secondary"
          onClick={handleCopyLink}
          title="Copy page link"
          style={{ padding: "4px 8px" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>

        {/* Star Favorite Button */}
        <button
          type="button"
          className="notion-btn-secondary"
          title="Favorite this page"
          style={{ padding: "4px 8px" }}
        >
          ☆
        </button>

        {/* More Actions Button */}
        <button
          type="button"
          className="notion-btn-secondary"
          title="More options"
          style={{ padding: "4px 8px" }}
        >
          ···
        </button>

        {onToggleComments ? (
          <button
            type="button"
            className={`notion-btn-secondary ${isCommentsOpen ? "active" : ""}`}
            onClick={onToggleComments}
            title="Toggle comments panel"
            style={{ padding: "4px 8px" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{commentsCount}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
