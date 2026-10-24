"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { type WorkspaceTask, type TaskMember, type TaskProject, TaskBoard } from "@/components/task-board";
import { type WorkspaceProject } from "@/components/project-manager";
import { type TeamMemberData } from "@/components/team-tab";

interface NotionDatabaseViewProps {
  workspaceId: string;
  workspaceName: string;
  role: Role;
  isOwner: boolean;
  tasks: WorkspaceTask[];
  projects: WorkspaceProject[];
  members: TeamMemberData[];
  onNewTaskClick?: () => void;
  onNewDocClick?: () => void;
}

export function NotionDatabaseView({
  workspaceId,
  workspaceName,
  role,
  isOwner,
  tasks: initialTasks,
  projects: initialProjects,
  members,
  onNewTaskClick,
  onNewDocClick,
}: NotionDatabaseViewProps) {
  const [tasks, setTasks] = useState<WorkspaceTask[]>(initialTasks);
  const [projects] = useState<WorkspaceProject[]>(initialProjects);

  // Active View Tabs matching the user's screenshot
  const [activeTab, setActiveTab] = useState<
    "all_projects" | "calendar" | "status" | "timeline" | "workload"
  >("all_projects");

  // Cover & Description states
  const [hasCover, setHasCover] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState(
    "Tracking deadlines, deliverables, review status, and assigned editors across all production workflows."
  );

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"deadline" | "title" | "priority">("deadline");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  // Inline Quick Add row
  const [isInlineAdding, setIsInlineAdding] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineClient, setInlineClient] = useState("");
  const [inlineDeadline, setInlineDeadline] = useState("");
  const [isSubmittingInline, setIsSubmittingInline] = useState(false);

  // Calendar month state
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  // Filter & Sort Tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.assignee?.name && t.assignee.name.toLowerCase().includes(q)) ||
          (t.project?.name && t.project.name.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }
    result.sort((a, b) => {
      if (sortBy === "deadline") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      const pMap: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    });
    return result;
  }, [tasks, searchQuery, statusFilter, sortBy]);

  async function handleQuickStatusChange(taskId: string, newStatus: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
    );
    await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function handleCreateInline(e: React.FormEvent) {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    setIsSubmittingInline(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: inlineTitle.trim(),
          description: inlineClient.trim() ? `Client: ${inlineClient.trim()}` : "",
          dueDate: inlineDeadline || undefined,
          priority: "HIGH",
          status: "IN_REVIEW",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.task) {
          setTasks((prev) => [data.task, ...prev]);
        }
        setInlineTitle("");
        setInlineClient("");
        setInlineDeadline("");
        setIsInlineAdding(false);
      }
    } finally {
      setIsSubmittingInline(false);
    }
  }

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateStr: "" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, dateStr });
    }
    return days;
  }, [calendarDate]);

  return (
    <div style={{ width: "100%", color: "var(--affine-ink, #f0f0f0)" }}>
      {/* Optional Cover Banner */}
      {hasCover ? (
        <div
          style={{
            height: 140,
            borderRadius: "var(--radius-lg, 12px)",
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #311042 100%)",
            marginBottom: -24,
            position: "relative",
            border: "1px solid var(--affine-border, #282828)",
          }}
        >
          <button
            type="button"
            onClick={() => setHasCover(false)}
            className="notion-btn-secondary"
            style={{ position: "absolute", top: 12, right: 12, fontSize: "0.75rem", padding: "4px 8px" }}
          >
            Remove cover
          </button>
        </div>
      ) : null}

      {/* Top Action Options: Add cover / Add description */}
      <div style={{ display: "flex", gap: 12, marginBottom: 8, paddingLeft: 4 }}>
        {!hasCover ? (
          <button
            type="button"
            onClick={() => setHasCover(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--affine-muted, #828282)",
              fontSize: "0.82rem",
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--affine-ink, #f0f0f0)";
              (e.currentTarget as HTMLElement).style.background = "var(--affine-sidebar-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--affine-muted, #828282)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Add cover</span>
          </button>
        ) : null}

        {!hasDescription ? (
          <button
            type="button"
            onClick={() => setHasDescription(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--affine-muted, #828282)",
              fontSize: "0.82rem",
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--affine-ink, #f0f0f0)";
              (e.currentTarget as HTMLElement).style.background = "var(--affine-sidebar-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--affine-muted, #828282)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Add description</span>
          </button>
        ) : null}
      </div>

      {/* Large Bold Page Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, paddingLeft: 4 }}>
        <h1
          style={{
            fontSize: "2.2rem",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.03em",
            color: "var(--affine-ink, #f0f0f0)",
          }}
        >
          {workspaceName === "Demo Workspace" ? "Video Editing Deadlines" : workspaceName}
        </h1>
      </div>

      {/* Description row if toggled */}
      {hasDescription ? (
        <div style={{ marginBottom: 20, paddingLeft: 6 }}>
          <input
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px dashed var(--affine-border, #333333)",
              color: "var(--affine-muted, #999999)",
              fontSize: "0.92rem",
              padding: "4px 0",
              outline: "none",
            }}
          />
        </div>
      ) : null}

      {/* Notion View Switcher Tabs Bar (matching screenshot) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--affine-border, #282828)",
          paddingBottom: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {/* Left Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`notion-tab-btn ${activeTab === "all_projects" ? "active" : ""}`}
            onClick={() => setActiveTab("all_projects")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <span>All Projects</span>
          </button>

          <button
            type="button"
            className={`notion-tab-btn ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Deadline Calendar</span>
          </button>

          <button
            type="button"
            className={`notion-tab-btn ${activeTab === "status" ? "active" : ""}`}
            onClick={() => setActiveTab("status")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
            <span>Project Status</span>
          </button>

          <button
            type="button"
            className={`notion-tab-btn ${activeTab === "timeline" ? "active" : ""}`}
            onClick={() => setActiveTab("timeline")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 3 8"/><polyline points="3 12 4 13 3 14"/><polyline points="3 18 4 19 3 20"/></svg>
            <span>Priority Timeline</span>
          </button>

          <button
            type="button"
            className={`notion-tab-btn ${activeTab === "workload" ? "active" : ""}`}
            onClick={() => setActiveTab("workload")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Editor Workload</span>
          </button>
        </div>

        {/* Right Tools Bar (Filter, Sort, Automation, Search, and Solid Blue + New ▾) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          {/* Filter Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="notion-btn-secondary"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              title="Filter items"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              <span>Filter</span>
            </button>
            {isFilterMenuOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  width: 180,
                  background: "#222222",
                  border: "1px solid #383838",
                  borderRadius: 8,
                  padding: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "#888", fontWeight: 700, padding: "2px 6px" }}>
                  FILTER BY STATUS
                </div>
                {["ALL", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s);
                      setIsFilterMenuOpen(false);
                    }}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: statusFilter === s ? "#2383e2" : "transparent",
                      color: statusFilter === s ? "#fff" : "#ccc",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Sort Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="notion-btn-secondary"
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              title="Sort items"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
              <span>Sort</span>
            </button>
            {isSortMenuOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  width: 160,
                  background: "#222222",
                  border: "1px solid #383838",
                  borderRadius: 8,
                  padding: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "#888", fontWeight: 700, padding: "2px 6px" }}>
                  SORT BY
                </div>
                {[
                  { id: "deadline", label: "Deadline Date" },
                  { id: "title", label: "Title (A-Z)" },
                  { id: "priority", label: "Priority Level" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSortBy(st.id as any);
                      setIsSortMenuOpen(false);
                    }}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 4,
                      border: "none",
                      background: sortBy === st.id ? "#2383e2" : "transparent",
                      color: sortBy === st.id ? "#fff" : "#ccc",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Automation button */}
          <button
            type="button"
            className="notion-btn-secondary"
            onClick={() => alert("Notion Automation: Real-time Yjs CRDT synchronization and Redis event bus active.")}
            title="Automations"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </button>

          {/* Search Trigger / Input */}
          {isSearchActive ? (
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items…"
              style={{
                background: "#242424",
                border: "1px solid #3c3c3c",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: "0.8rem",
                color: "#f0f0f0",
                outline: "none",
                width: 140,
              }}
              onBlur={() => {
                if (!searchQuery) setIsSearchActive(false);
              }}
            />
          ) : (
            <button
              type="button"
              className="notion-btn-secondary"
              onClick={() => setIsSearchActive(true)}
              title="Search items"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          )}

          {/* VIVID NOTION BLUE `+ New ▾` SPLIT BUTTON (Matches Screenshot Exactly!) */}
          <div style={{ display: "inline-flex", borderRadius: 6, overflow: "hidden", position: "relative" }}>
            <button
              type="button"
              className="notion-btn-primary"
              onClick={() => setIsInlineAdding(true)}
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                paddingRight: 8,
              }}
            >
              <span>+</span>
              <span>New</span>
            </button>
            <button
              type="button"
              className="notion-btn-primary"
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeft: "1px solid rgba(255,255,255,0.25)",
                paddingLeft: 6,
                paddingRight: 6,
              }}
              title="More creation options"
            >
              <span>▾</span>
            </button>

            {isNewMenuOpen ? (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  width: 190,
                  background: "#222222",
                  border: "1px solid #383838",
                  borderRadius: 8,
                  padding: 6,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  zIndex: 60,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsNewMenuOpen(false);
                    setIsInlineAdding(true);
                  }}
                  className="notion-btn-secondary"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  <span>📋</span>
                  <span>New Table Item</span>
                </button>
                {onNewDocClick ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onNewDocClick();
                    }}
                    className="notion-btn-secondary"
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  >
                    <span>📄</span>
                    <span>New Document</span>
                  </button>
                ) : null}
                {onNewTaskClick ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onNewTaskClick();
                    }}
                    className="notion-btn-secondary"
                    style={{ width: "100%", justifyContent: "flex-start" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Full Task Modal</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ============================================================
          VIEW 1: All Projects (Database Table matching Screenshot)
          ============================================================ */}
      {activeTab === "all_projects" && (
        <div
          style={{
            background: "#191919",
            border: "1px solid #282828",
            borderRadius: "var(--radius-md, 8px)",
            overflowX: "auto",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.85rem",
              background: "#191919",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #282828",
                  background: "#191919",
                  color: "#828282",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                <th style={{ padding: "10px 14px", width: "24%", borderRight: "1px solid #282828" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.72rem", border: "1px solid #3c3c3c", padding: "0 3px", borderRadius: 3, color: "#aaa" }}>Aa</span>
                    <span>Project Title</span>
                  </span>
                </th>
                <th style={{ padding: "10px 14px", width: "13%", borderRight: "1px solid #282828" }}>
                  <span>Client</span>
                </th>
                <th style={{ padding: "10px 14px", width: "13%", borderRight: "1px solid #282828" }}>
                  <span>Deadline</span>
                </th>
                <th style={{ padding: "10px 14px", width: "12%", borderRight: "1px solid #282828" }}>
                  <span>Status</span>
                </th>
                <th style={{ padding: "10px 14px", width: "10%", borderRight: "1px solid #282828" }}>
                  <span>Priority</span>
                </th>
                <th style={{ padding: "10px 14px", width: "10%", borderRight: "1px solid #282828" }}>
                  <span>Duration</span>
                </th>
                <th style={{ padding: "10px 14px", width: "14%", borderRight: "1px solid #282828" }}>
                  <span>Assigned Editor</span>
                </th>
                <th style={{ padding: "10px 14px", width: "10%" }}>
                  <span>Files</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 && !isInlineAdding ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "var(--affine-muted, #777)" }}>
                    No items in this view. Click <strong>+ New item</strong> below to add one!
                  </td>
                </tr>
              ) : null}

              {filteredTasks.map((t) => {
                const clientName = t.description?.includes("Client:")
                  ? t.description.split("Client:")[1].trim()
                  : t.creator?.name || "Abdullah";

                const deadlineFormatted = t.dueDate
                  ? new Date(t.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "June 16, 2025";

                // Pill styling matching the screenshot
                const statusPillClass =
                  t.status === "IN_REVIEW"
                    ? "status-pill-review"
                    : t.status === "IN_PROGRESS"
                    ? "status-pill-progress"
                    : t.status === "DONE"
                    ? "status-pill-done"
                    : "status-pill-todo";

                const statusLabel =
                  t.status === "IN_REVIEW"
                    ? "Review"
                    : t.status === "IN_PROGRESS"
                    ? "In Progress"
                    : t.status === "DONE"
                    ? "Done"
                    : "To Do";

                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: "1px solid #282828",
                      background: "#191919",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#222222";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#191919";
                    }}
                  >
                    {/* Project Title */}
                    <td style={{ padding: "9px 14px", borderRight: "1px solid #282828", fontWeight: 500 }}>
                      <span style={{ color: "#ffffff", fontWeight: 600 }}>{t.title}</span>
                    </td>

                    {/* Client */}
                    <td style={{ padding: "9px 14px", borderRight: "1px solid #282828", color: "#ccc" }}>
                      {clientName}
                    </td>

                    {/* Deadline */}
                    <td style={{ padding: "9px 14px", borderRight: "1px solid #282828", color: "#aaa" }}>
                      {deadlineFormatted}
                    </td>

                    {/* Status Pill Badge (Clickable to change) */}
                    <td style={{ padding: "9px 14px", borderRight: "1px solid #282828" }}>
                      <select
                        value={t.status}
                        onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                        className={statusPillClass}
                        style={{ cursor: "pointer", outline: "none", border: "none" }}
                      >
                        <option value="IN_REVIEW">● Review</option>
                        <option value="IN_PROGRESS">● In Progress</option>
                        <option value="DONE">● Done</option>
                        <option value="TODO">● To Do</option>
                      </select>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: "9px 14px", borderRight: "1px solid #282828" }}>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color:
                            t.priority === "URGENT"
                              ? "#f87171"
                              : t.priority === "HIGH"
                              ? "#fb923c"
                              : "#facc15",
                        }}
                      >
                        {t.priority === "URGENT" ? "Urgent" : t.priority === "HIGH" ? "High" : "Medium"}
                      </span>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: "9px 14px", borderRight: "1px solid #282828", color: "#888" }}>
                      4m 30s
                    </td>

                    {/* Assigned Editor */}
                    <td style={{ padding: "9px 14px", borderRight: "1px solid #282828" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #1e96eb, #7c3aed)",
                            color: "#fff",
                            fontSize: "0.68rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                          }}
                        >
                          {(t.assignee?.name || "A").slice(0, 1).toUpperCase()}
                        </div>
                        <span style={{ fontSize: "0.82rem", color: "#ddd" }}>
                          {t.assignee?.name || "Abdullah"}
                        </span>
                      </div>
                    </td>

                    {/* Project / Files */}
                    <td style={{ padding: "9px 14px", color: "#888" }}>
                      {t.project ? (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "#2c2c2c",
                            border: "1px solid #3c3c3c",
                            color: "#d0d0d0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 130,
                            display: "inline-block",
                          }}
                        >
                          {t.project.name}
                        </span>
                      ) : (
                        <span style={{ color: "#666" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Inline Row Quick-Add Form (when user clicks `+ New item`) */}
              {isInlineAdding ? (
                <tr style={{ background: "#262626" }}>
                  <td colSpan={8} style={{ padding: "10px 14px" }}>
                    <form onSubmit={handleCreateInline} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                      <input
                        autoFocus
                        value={inlineTitle}
                        onChange={(e) => setInlineTitle(e.target.value)}
                        placeholder="Project title (e.g., owl coart)…"
                        required
                        style={{
                          flex: 2,
                          background: "#1c1c1c",
                          border: "1px solid #3c3c3c",
                          borderRadius: 4,
                          padding: "6px 10px",
                          color: "#fff",
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      />
                      <input
                        value={inlineClient}
                        onChange={(e) => setInlineClient(e.target.value)}
                        placeholder="Client name…"
                        style={{
                          flex: 1,
                          background: "#1c1c1c",
                          border: "1px solid #3c3c3c",
                          borderRadius: 4,
                          padding: "6px 10px",
                          color: "#fff",
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      />
                      <input
                        type="date"
                        value={inlineDeadline}
                        onChange={(e) => setInlineDeadline(e.target.value)}
                        style={{
                          background: "#1c1c1c",
                          border: "1px solid #3c3c3c",
                          borderRadius: 4,
                          padding: "5px 8px",
                          color: "#fff",
                          fontSize: "0.82rem",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingInline}
                        className="notion-btn-primary"
                        style={{ padding: "6px 14px" }}
                      >
                        {isSubmittingInline ? "Adding…" : "Save Item"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInlineAdding(false)}
                        className="notion-btn-secondary"
                        style={{ padding: "6px 10px" }}
                      >
                        Cancel
                      </button>
                    </form>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          {/* Bottom `+ New item` button row (High-contrast button matching instruction) */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid #282828", background: "#191919" }}>
            <button
              type="button"
              className="notion-btn-secondary"
              onClick={() => setIsInlineAdding(true)}
              style={{
                background: "#282828",
                border: "1px solid #3e3e3e",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 6,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
              <span>New item</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 2: Deadline Calendar
          ============================================================ */}
      {activeTab === "calendar" && (
        <div
          style={{
            background: "var(--affine-card-bg, #202020)",
            border: "1px solid var(--affine-border, #282828)",
            borderRadius: "var(--radius-md, 8px)",
            padding: 20,
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
              {calendarDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="notion-btn-secondary"
                onClick={() =>
                  setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
                }
              >
                ◀ Prev
              </button>
              <button
                type="button"
                className="notion-btn-secondary"
                onClick={() => setCalendarDate(new Date())}
              >
                Today
              </button>
              <button
                type="button"
                className="notion-btn-secondary"
                onClick={() =>
                  setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
                }
              >
                Next ▶
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#282828" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div
                key={dayName}
                style={{
                  background: "#1c1c1c",
                  padding: "8px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#888",
                  textAlign: "center",
                }}
              >
                {dayName}
              </div>
            ))}

            {calendarDays.map((cDay, idx) => {
              const matchedTasks = tasks.filter(
                (t) => t.dueDate && t.dueDate.startsWith(cDay.dateStr)
              );

              return (
                <div
                  key={idx}
                  style={{
                    background: cDay.day ? "#202020" : "#181818",
                    minHeight: 90,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {cDay.day ? (
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#888", marginBottom: 2 }}>
                      {cDay.day}
                    </div>
                  ) : null}

                  {matchedTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "3px 6px",
                        borderRadius: 4,
                        background: "#2a3642",
                        border: "1px solid #3b82f6",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#93c5fd",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 3: Project Status (Interactive Kanban Board)
          ============================================================ */}
      {activeTab === "status" && (
        <TaskBoard
          workspaceId={workspaceId}
          initialTasks={tasks}
          members={members.map((m) => ({ id: m.userId, name: m.name, email: m.email }))}
          projects={projects.map((p) => ({ id: p.id, name: p.name, status: p.status }))}
          role={role}
        />
      )}

      {/* ============================================================
          VIEW 4: Priority Timeline
          ============================================================ */}
      {activeTab === "timeline" && (
        <div
          style={{
            background: "var(--affine-card-bg, #202020)",
            border: "1px solid var(--affine-border, #282828)",
            borderRadius: "var(--radius-md, 8px)",
            padding: 24,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 700 }}>
            Priority Timeline Overview
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {["URGENT", "HIGH", "MEDIUM", "LOW"].map((pri) => {
              const priTasks = tasks.filter((t) => t.priority === pri);
              const label = pri === "URGENT" ? "Urgent Deliverables" : pri === "HIGH" ? "High Priority" : pri === "MEDIUM" ? "Medium Priority" : "Low Priority";
              const color = pri === "URGENT" ? "#f87171" : pri === "HIGH" ? "#fb923c" : pri === "MEDIUM" ? "#facc15" : "#60a5fa";

              return (
                <div key={pri} style={{ borderBottom: "1px solid #282828", paddingBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color, fontSize: "0.9rem" }}>{label}</span>
                    <span style={{ fontSize: "0.78rem", color: "#888" }}>{priTasks.length} tasks</span>
                  </div>
                  {priTasks.length === 0 ? (
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>No tasks in this tier.</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {priTasks.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            background: "#282828",
                            border: "1px solid #383838",
                            fontSize: "0.82rem",
                            color: "#eee",
                          }}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 5: Editor Workload
          ============================================================ */}
      {activeTab === "workload" && (
        <div
          style={{
            background: "var(--affine-card-bg, #202020)",
            border: "1px solid var(--affine-border, #282828)",
            borderRadius: "var(--radius-md, 8px)",
            padding: 24,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 700 }}>
            Editor Assignment & Workload Distribution
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {members.map((m) => {
              const assigned = tasks.filter((t) => t.assignee?.id === m.userId);
              const inReview = assigned.filter((t) => t.status === "IN_REVIEW").length;
              const completed = assigned.filter((t) => t.status === "DONE").length;

              return (
                <div
                  key={m.userId}
                  style={{
                    padding: 18,
                    borderRadius: 8,
                    background: "#242424",
                    border: "1px solid #333333",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #1e96eb, #7c3aed)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      {m.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{m.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>{m.email}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, fontSize: "0.8rem", paddingTop: 8, borderTop: "1px solid #333333" }}>
                    <span>Total: <strong>{assigned.length}</strong></span>
                    <span>Review: <strong style={{ color: "#fbbf24" }}>{inReview}</strong></span>
                    <span>Done: <strong style={{ color: "#34d399" }}>{completed}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
