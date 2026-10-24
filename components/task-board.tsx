"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, TaskPriority, TaskStatus, ProjectStatus } from "@prisma/client";

export interface TaskMember {
  id: string;
  name: string;
  email: string;
}

export interface TaskProject {
  id: string;
  name: string;
  status: ProjectStatus;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  assignee: TaskMember | null;
  creator: { id: string; name: string };
  project: TaskProject | null;
  createdAt: string;
}

interface TaskBoardProps {
  workspaceId: string;
  initialTasks: WorkspaceTask[];
  members: TaskMember[];
  projects: TaskProject[];
  role: Role;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; className: string }[] = [
  { id: "TODO", label: "To Do", color: "#8c8c8c", className: "kanban-col-todo" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#38bdf8", className: "kanban-col-in_progress" },
  { id: "IN_REVIEW", label: "In Review", color: "#facc15", className: "kanban-col-in_review" },
  { id: "DONE", label: "Completed", color: "#4ade80", className: "kanban-col-done" },
];

export function TaskBoard({ workspaceId, initialTasks, members, projects, role }: TaskBoardProps) {
  const router = useRouter();
  const canEdit = role === "EDIT";

  const [tasks, setTasks] = useState<WorkspaceTask[]>(initialTasks);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for Create / Edit
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<TaskStatus>("TODO");
  const [formPriority, setFormPriority] = useState<TaskPriority>("MEDIUM");
  const [formAssigneeId, setFormAssigneeId] = useState<string>("");
  const [formProjectId, setFormProjectId] = useState<string>("");
  const [formDueDate, setFormDueDate] = useState<string>("");

  // Drag & drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Inline Quick-Add Task state
  const [inlineAddingCol, setInlineAddingCol] = useState<TaskStatus | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");

  async function handleQuickAddTask(status: TaskStatus) {
    if (!inlineTitle.trim()) return;
    const titleToAdd = inlineTitle.trim();
    setInlineTitle("");
    setInlineAddingCol(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleToAdd,
          status,
          priority: "MEDIUM",
        }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        router.refresh();
      }
    } catch (err) {
      console.error("Error creating inline task:", err);
    }
  }

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormStatus("TODO");
    setFormPriority("MEDIUM");
    setFormAssigneeId("");
    setFormProjectId("");
    setFormDueDate("");
    setError(null);
  }

  function openCreateModal(defaultStatus: TaskStatus = "TODO") {
    resetForm();
    setFormStatus(defaultStatus);
    setIsCreateOpen(true);
  }

  function openEditModal(task: WorkspaceTask) {
    setError(null);
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || "");
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormAssigneeId(task.assignee?.id || "");
    setFormProjectId(task.project?.id || "");
    setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedProject !== "ALL" && t.project?.id !== selectedProject) {
      return false;
    }
    if (selectedPriority !== "ALL" && t.priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  // Create Task
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          status: formStatus,
          priority: formPriority,
          assigneeId: formAssigneeId || null,
          projectId: formProjectId || null,
          dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create task");
      }

      setTasks((prev) => [data.task, ...prev]);
      setIsCreateOpen(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Update Task
  async function handleUpdateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTask || !formTitle.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          status: formStatus,
          priority: formPriority,
          assigneeId: formAssigneeId || null,
          projectId: formProjectId || null,
          dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update task");
      }

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? data.task : t)));
      setEditingTask(null);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete Task
  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setEditingTask(null);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting task");
    }
  }

  // Move task status directly (Drag or Drop)
  async function moveTaskStatus(taskId: string, newStatus: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus || !canEdit) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // revert on failure
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
        );
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line)",
              fontSize: "0.88rem",
              width: 200,
            }}
          />

          {/* Filter by Project */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line)",
              fontSize: "0.85rem",
              background: "#fff",
            }}
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Filter by Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line)",
              fontSize: "0.85rem",
              background: "#fff",
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* View mode toggle */}
          <div
            style={{
              display: "inline-flex",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line)",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              style={{
                padding: "6px 12px",
                border: "none",
                background: viewMode === "kanban" ? "var(--bg-hover)" : "transparent",
                fontWeight: viewMode === "kanban" ? 700 : 500,
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 12px",
                border: "none",
                background: viewMode === "table" ? "var(--bg-hover)" : "transparent",
                fontWeight: viewMode === "table" ? 700 : 500,
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Table
            </button>
          </div>
        </div>

        {canEdit ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreateModal()}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
            <span>New Task</span>
          </button>
        ) : null}
      </div>

      {/* Kanban Board View */}
      {viewMode === "kanban" ? (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const isDragTarget = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                className={`kanban-col ${col.className} ${isDragTarget ? "drag-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (canEdit && dragOverColumn !== col.id) {
                    setDragOverColumn(col.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverColumn === col.id) {
                    setDragOverColumn(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  if (draggedTaskId && canEdit) {
                    moveTaskStatus(draggedTaskId, col.id);
                    setDraggedTaskId(null);
                  }
                }}
              >
                <div className="kanban-col-header">
                  <div className="kanban-col-title">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, display: "inline-block" }} />
                    <span>{col.label}</span>
                  </div>
                  <span className="kanban-col-count">{colTasks.length}</span>
                </div>

                <div className="kanban-col-cards">
                  {colTasks.length === 0 ? (
                    <div
                      style={{
                        padding: "24px 12px",
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "0.82rem",
                        fontStyle: "italic",
                      }}
                    >
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`kanban-card ${draggedTaskId === task.id ? "dragging" : ""}`}
                        draggable={canEdit}
                        onDragStart={() => {
                          if (canEdit) setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => openEditModal(task)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                          <span className={`priority-tag priority-${task.priority}`}>
                            {task.priority}
                          </span>
                          {task.project ? (
                            <span className="kanban-card-project-pill" title={task.project.name} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                              </svg>
                              {task.project.name}
                            </span>
                          ) : null}
                        </div>

                        <div className="kanban-card-title">{task.title}</div>

                        {task.description ? (
                          <div className="kanban-card-desc">{task.description}</div>
                        ) : null}

                        <div className="kanban-card-footer" onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {task.dueDate ? (
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                              </span>
                            ) : null}

                            {canEdit ? (
                              <select
                                value={task.status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  moveTaskStatus(task.id, e.target.value as TaskStatus);
                                }}
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "2px 4px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--line)",
                                  background: "var(--bg-subtle)",
                                  color: "var(--ink-secondary)",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="IN_REVIEW">In Review</option>
                                <option value="DONE">Completed</option>
                              </select>
                            ) : null}
                          </div>

                          {task.assignee ? (
                            <div className="user-avatar-small" title={`Assigned to ${task.assignee.name}`}>
                              {task.assignee.name.slice(0, 2).toUpperCase()}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--muted-light)" }}>Unassigned</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {canEdit ? (
                  inlineAddingCol === col.id ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        padding: 10,
                        background: "#ffffff",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--affine-primary)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="Task title... (Enter to save)"
                        value={inlineTitle}
                        onChange={(e) => setInlineTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleQuickAddTask(col.id);
                          } else if (e.key === "Escape") {
                            setInlineAddingCol(null);
                            setInlineTitle("");
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          fontSize: "0.85rem",
                          border: "1px solid var(--line)",
                          borderRadius: "var(--radius-sm)",
                          outline: "none",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setInlineAddingCol(null);
                            setInlineTitle("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            color: "var(--muted)",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleQuickAddTask(col.id)}
                          className="btn btn-primary"
                          style={{
                            fontSize: "0.78rem",
                            padding: "4px 10px",
                            background: "var(--affine-primary)",
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAddingCol(col.id);
                          setInlineTitle("");
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          background: "transparent",
                          border: "1px dashed var(--line-strong)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--muted)",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "var(--transition)",
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.background = "#fff";
                          (e.target as HTMLElement).style.color = "var(--ink)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.background = "transparent";
                          (e.target as HTMLElement).style.color = "var(--muted)";
                        }}
                      >
                        + Add Task
                      </button>
                      <button
                        type="button"
                        onClick={() => openCreateModal(col.id)}
                        title="Open full create task modal"
                        style={{
                          padding: "6px 10px",
                          background: "transparent",
                          border: "1px solid var(--line)",
                          borderRadius: "var(--radius-md)",
                          color: "var(--muted)",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                        }}
                      >
                        ⋯
                      </button>
                    </div>
                  )
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>Task</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Priority</th>
                <th style={{ padding: "12px 16px" }}>Project</th>
                <th style={{ padding: "12px 16px" }}>Assignee</th>
                <th style={{ padding: "12px 16px" }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)" }}>
                    No tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openEditModal(t)}
                    style={{
                      borderBottom: "1px solid var(--line)",
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{t.title}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`status-tag status-${t.status === "DONE" ? "COMPLETED" : t.status === "IN_PROGRESS" ? "ACTIVE" : "PLANNING"}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`priority-tag priority-${t.priority}`}>{t.priority}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                      {t.project ? t.project.name : "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {t.assignee ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="user-avatar-small">{t.assignee.name.slice(0, 2).toUpperCase()}</span>
                          <span>{t.assignee.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted-light)" }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--muted)" }}>
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateOpen ? (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                {error ? <div className="alert alert-danger">{error}</div> : null}

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Implement user authentication flow"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--line)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Add details, acceptance criteria, or context..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--line)",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Priority
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Assignee
                    </label>
                    <select
                      value={formAssigneeId}
                      onChange={(e) => setFormAssigneeId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Project
                    </label>
                    <select
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <option value="">No Project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--line)",
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Task Modal */}
      {editingTask ? (
        <div className="modal-backdrop" onClick={() => setEditingTask(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{canEdit ? "Edit Task" : "Task Details"}</h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateTask}>
              <div className="modal-body">
                {error ? <div className="alert alert-danger">{error}</div> : null}

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canEdit}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--line)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--line)",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Status
                    </label>
                    <select
                      disabled={!canEdit}
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Priority
                    </label>
                    <select
                      disabled={!canEdit}
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Assignee
                    </label>
                    <select
                      disabled={!canEdit}
                      value={formAssigneeId}
                      onChange={(e) => setFormAssigneeId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Project
                    </label>
                    <select
                      disabled={!canEdit}
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                      }}
                    >
                      <option value="">No Project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    disabled={!canEdit}
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--line)",
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id)}
                    style={{
                      color: "var(--danger)",
                      background: "none",
                      border: "none",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Delete Task
                  </button>
                ) : <span />}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingTask(null)}
                  >
                    Close
                  </button>
                  {canEdit ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
