"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, ProjectStatus, TaskStatus } from "@prisma/client";

export interface ProjectFileData {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  fileUrl: string;
  createdAt: string;
  uploadedBy?: { id: string; name: string; email: string };
}

export interface WorkspaceProject {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { tasks: number; files: number; pages: number };
  tasks: { id: string; status: TaskStatus }[];
  files: ProjectFileData[];
}

interface ProjectManagerProps {
  workspaceId: string;
  initialProjects: WorkspaceProject[];
  role: Role;
}

export function ProjectManager({ workspaceId, initialProjects, role }: ProjectManagerProps) {
  const router = useRouter();
  const canEdit = role === "EDIT";

  const [projects, setProjects] = useState<WorkspaceProject[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<WorkspaceProject | null>(null);

  // Create Project Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("PLANNING");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectTargetDate, setProjectTargetDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Upload state for selected project
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  function resetCreateForm() {
    setProjectName("");
    setProjectDesc("");
    setProjectStatus("PLANNING");
    setProjectStartDate("");
    setProjectTargetDate("");
    setError(null);
  }

  // Create Project
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDesc.trim() || null,
          status: projectStatus,
          startDate: projectStartDate ? new Date(projectStartDate).toISOString() : null,
          targetDate: projectTargetDate ? new Date(projectTargetDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create project");
      }

      setProjects((prev) => [data.project, ...prev]);
      setIsCreateOpen(false);
      resetCreateForm();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Update Project Status
  async function handleUpdateProjectStatus(projectId: string, newStatus: ProjectStatus) {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update status");

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      if (selectedProject?.id === projectId) {
        setSelectedProject((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating project status");
    }
  }

  // Delete Project
  async function handleDeleteProject(projectId: string) {
    if (!confirm("Are you sure you want to delete this project and all its files?")) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setSelectedProject(null);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting project");
    }
  }

  // Upload Project File
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    setIsUploading(true);
    setFileError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${selectedProject.id}/files`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to upload file");
      }

      // Update files in state
      setSelectedProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          files: [data.file, ...prev.files],
          _count: { ...prev._count, files: prev._count.files + 1 },
        };
      });

      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? {
                ...p,
                files: [data.file, ...p.files],
                _count: { ...p._count, files: p._count.files + 1 },
              }
            : p
        )
      );

      router.refresh();
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : "Error uploading file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  // Delete Project File
  async function handleDeleteFile(fileId: string) {
    if (!selectedProject || !confirm("Delete this file?")) return;

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${selectedProject.id}/files/${fileId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete file");

      setSelectedProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          files: prev.files.filter((f) => f.id !== fileId),
          _count: { ...prev._count, files: Math.max(0, prev._count.files - 1) },
        };
      });

      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? {
                ...p,
                files: p.files.filter((f) => f.id !== fileId),
                _count: { ...p._count, files: Math.max(0, p._count.files - 1) },
              }
            : p
        )
      );

      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting file");
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header with New Project button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Workspace Projects</h2>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>
            Manage ongoing initiatives, track status, and store project files and assets.
          </p>
        </div>

        {canEdit ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              resetCreateForm();
              setIsCreateOpen(true);
            }}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
            <span>New Project</span>
          </button>
        ) : null}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ color: "var(--affine-muted)", marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 style={{ margin: "0 0 8px" }}>No projects created yet</h3>
          <p className="muted" style={{ margin: "0 0 16px", fontSize: "0.9rem" }}>
            Group tasks, documents, and files into projects to stay organized.
          </p>
          {canEdit ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
            >
              Create your first project
            </button>
          ) : null}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const totalTasks = project.tasks.length;
            const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
            const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={project.id}
                className="project-card"
                onClick={() => setSelectedProject(project)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <div className="project-card-header">
                    <h3 className="project-card-title">{project.name}</h3>
                    <span className={`status-tag status-${project.status}`}>
                      {project.status.replace("_", " ")}
                    </span>
                  </div>

                  {project.description ? (
                    <p className="project-card-desc">{project.description}</p>
                  ) : (
                    <p className="project-card-desc" style={{ fontStyle: "italic", opacity: 0.6 }}>
                      No description provided.
                    </p>
                  )}
                </div>

                <div>
                  {/* Task Progress Bar */}
                  <div className="progress-bar-wrap">
                    <div className="progress-bar-label">
                      <span>Task Progress</span>
                      <span>{doneTasks}/{totalTasks} ({progress}%)</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="project-card-meta">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span title="Tasks count">📋 {totalTasks} {totalTasks === 1 ? "task" : "tasks"}</span>
                      <span title="Files count">📎 {project.files.length} {project.files.length === 1 ? "file" : "files"}</span>
                    </div>
                    {project.targetDate ? (
                      <span title="Target completion date">
                        🎯 {new Date(project.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateOpen ? (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Project</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                {error ? <div className="alert alert-danger">{error}</div> : null}

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Mobile App Redesign"
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
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Project overview, goals, or deliverables..."
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
                    Status
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--line)",
                      background: "#fff",
                    }}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={projectStartDate}
                      onChange={(e) => setProjectStartDate(e.target.value)}
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
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={projectTargetDate}
                      onChange={(e) => setProjectTargetDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                      }}
                    />
                  </div>
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
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Project Detail & Files Modal */}
      {selectedProject ? (
        <div className="modal-backdrop" onClick={() => setSelectedProject(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: 650 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  {selectedProject.name}
                </h3>
                <span className={`status-tag status-${selectedProject.status}`}>
                  {selectedProject.status.replace("_", " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ gap: 20 }}>
              {selectedProject.description ? (
                <p style={{ margin: 0, color: "var(--ink-secondary)", fontSize: "0.92rem", lineHeight: 1.5 }}>
                  {selectedProject.description}
                </p>
              ) : null}

              {/* Status Selector if canEdit */}
              {canEdit ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg-subtle)", padding: 12, borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Update Status:</span>
                  <select
                    value={selectedProject.status}
                    onChange={(e) =>
                      handleUpdateProjectStatus(selectedProject.id, e.target.value as ProjectStatus)
                    }
                    style={{
                      padding: "6px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--line)",
                      background: "#fff",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              ) : null}

              {/* Project Files Section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: "1rem" }}>
                    📎 Project Files ({selectedProject.files.length})
                  </h4>

                  {canEdit ? (
                    <label
                      className="btn btn-secondary"
                      style={{
                        cursor: isUploading ? "wait" : "pointer",
                        fontSize: "0.82rem",
                        padding: "6px 12px",
                      }}
                    >
                      {isUploading ? "Uploading..." : "+ Upload File"}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        style={{ display: "none" }}
                      />
                    </label>
                  ) : null}
                </div>

                {fileError ? <div className="alert alert-danger">{fileError}</div> : null}

                {selectedProject.files.length === 0 ? (
                  <div
                    style={{
                      border: "2px dashed var(--line)",
                      borderRadius: "var(--radius-md)",
                      padding: "24px 16px",
                      textAlign: "center",
                      color: "var(--muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    No files attached to this project yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedProject.files.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          border: "1px solid var(--line)",
                          borderRadius: "var(--radius-md)",
                          background: "#fff",
                          fontSize: "0.88rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                          <span style={{ fontSize: "1.2rem" }}>📄</span>
                          <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {file.name}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                              {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <a
                            href={file.fileUrl}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--accent)",
                              fontWeight: 600,
                              fontSize: "0.82rem",
                            }}
                          >
                            Download ↓
                          </a>

                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--danger)",
                                cursor: "pointer",
                                fontSize: "0.82rem",
                                padding: "4px 8px",
                              }}
                            >
                              ✕
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => handleDeleteProject(selectedProject.id)}
                  style={{
                    color: "var(--danger)",
                    background: "none",
                    border: "none",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Delete Project
                </button>
              ) : <span />}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedProject(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
