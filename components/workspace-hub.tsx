"use client";

import { useState } from "react";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { CreatePageForm } from "@/components/create-page-form";
import { TaskBoard, type WorkspaceTask, type TaskMember, type TaskProject } from "@/components/task-board";
import { ProjectManager, type WorkspaceProject } from "@/components/project-manager";
import { TeamTab, type TeamMemberData } from "@/components/team-tab";

export interface WorkspaceDoc {
  id: string;
  title: string;
  updatedAt: string;
}

interface WorkspaceHubProps {
  workspaceId: string;
  role: Role;
  isOwner: boolean;
  pages: WorkspaceDoc[];
  projects: WorkspaceProject[];
  tasks: WorkspaceTask[];
  members: TeamMemberData[];
}

export function WorkspaceHub({
  workspaceId,
  role,
  isOwner,
  pages,
  projects,
  tasks,
  members,
}: WorkspaceHubProps) {
  const [activeTab, setActiveTab] = useState<"docs" | "projects" | "tasks" | "team">("docs");

  const taskMembers: TaskMember[] = members.map((m) => ({
    id: m.userId,
    name: m.name,
    email: m.email,
  }));

  const taskProjects: TaskProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Notion-Style Tabs Navigation Bar */}
      <div className="workspace-nav-bar">
        <div className="workspace-tabs">
          <button
            type="button"
            className={`tab-nav-btn ${activeTab === "docs" ? "active" : ""}`}
            onClick={() => setActiveTab("docs")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>Documents</span>
            <span className="tab-nav-badge">{pages.length}</span>
          </button>

          <button
            type="button"
            className={`tab-nav-btn ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Projects</span>
            <span className="tab-nav-badge">{projects.length}</span>
          </button>

          <button
            type="button"
            className={`tab-nav-btn ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <span>Tasks</span>
            <span className="tab-nav-badge">{tasks.length}</span>
          </button>

          <button
            type="button"
            className={`tab-nav-btn ${activeTab === "team" ? "active" : ""}`}
            onClick={() => setActiveTab("team")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Team</span>
            <span className="tab-nav-badge">{members.length}</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "docs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Collaborative Documents</h2>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>
                Real-time rich text documents powered by Yjs CRDT and WebSockets.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            {role === "EDIT" ? (
              <div style={{ marginBottom: 20 }}>
                <CreatePageForm workspaceId={workspaceId} />
              </div>
            ) : null}

            <div className="page-list">
              {pages.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>📄</div>
                  <p style={{ margin: 0 }}>No documents yet. Create one above to start collaborating in real-time!</p>
                </div>
              ) : (
                pages.map((page) => (
                  <Link key={page.id} href={`/w/${workspaceId}/p/${page.id}`}>
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: "1.2rem" }}>📄</span>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{page.title}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                          Updated {new Date(page.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </span>
                    <span className="muted" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      Open Editor →
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <ProjectManager
          workspaceId={workspaceId}
          initialProjects={projects}
          role={role}
        />
      )}

      {activeTab === "tasks" && (
        <TaskBoard
          workspaceId={workspaceId}
          initialTasks={tasks}
          members={taskMembers}
          projects={taskProjects}
          role={role}
        />
      )}

      {activeTab === "team" && (
        <TeamTab
          workspaceId={workspaceId}
          isOwner={isOwner}
          initialMembers={members}
        />
      )}
    </div>
  );
}
