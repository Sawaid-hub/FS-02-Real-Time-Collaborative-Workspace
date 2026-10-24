"use client";

import { useState } from "react";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { AffineSidebar } from "@/components/affine-sidebar";
import { AffineHeader } from "@/components/affine-header";
import { TaskBoard, type WorkspaceTask, type TaskMember, type TaskProject } from "@/components/task-board";
import { ProjectManager, type WorkspaceProject } from "@/components/project-manager";
import { TeamTab, type TeamMemberData } from "@/components/team-tab";
import { CreatePageForm } from "@/components/create-page-form";
import { CommandPalette, type SearchItem } from "@/components/command-palette";
import { useRouter } from "next/navigation";

import { NotionDatabaseView } from "@/components/notion-database-view";

export interface WorkspaceDoc {
  id: string;
  title: string;
  updatedAt: string;
}

interface AffineWorkspaceViewProps {
  workspaceId: string;
  workspaceName: string;
  role: Role;
  isOwner: boolean;
  pages: WorkspaceDoc[];
  projects: WorkspaceProject[];
  tasks: WorkspaceTask[];
  members: TeamMemberData[];
  userName?: string;
  userEmail?: string;
}

export function AffineWorkspaceView({
  workspaceId,
  workspaceName,
  role,
  isOwner,
  pages,
  projects,
  tasks,
  members,
  userName = "User",
  userEmail = "",
}: AffineWorkspaceViewProps) {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<"docs" | "projects" | "tasks" | "team">("docs");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLangPrompt, setShowLangPrompt] = useState(true);

  const searchItems: SearchItem[] = [
    ...pages.map((p) => ({
      id: p.id,
      type: "doc" as const,
      title: p.title || "Untitled",
      subtitle: `Updated ${new Date(p.updatedAt).toLocaleDateString()}`,
      url: `/w/${workspaceId}/p/${p.id}`,
      badge: "Document",
    })),
    ...projects.map((pr) => ({
      id: pr.id,
      type: "project" as const,
      title: pr.name,
      subtitle: pr.description || `Project Status: ${pr.status}`,
      badge: pr.status,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      subtitle: `${t.status.replace("_", " ")} • Priority: ${t.priority}`,
      badge: t.priority,
    })),
    ...members.map((m) => ({
      id: m.userId,
      type: "member" as const,
      title: m.name,
      subtitle: m.email,
      badge: m.role,
    })),
  ];

  function handleSearchSelect(item: SearchItem) {
    if (item.type === "doc" && item.url) {
      router.push(item.url);
    } else if (item.type === "project") {
      setActiveNav("projects");
    } else if (item.type === "task") {
      setActiveNav("tasks");
    } else if (item.type === "member") {
      setActiveNav("team");
    }
  }

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

  const navTitles = {
    docs: "Video Editing Deadlines",
    projects: "Projects",
    tasks: "Tasks & Board",
    team: "Team Members",
  };

  return (
    <div className="affine-shell">
      {/* Quick Search Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={searchItems}
        onSelectItem={handleSearchSelect}
      />

      {/* Left Application Sidebar */}
      <AffineSidebar
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        role={role}
        isOwner={isOwner}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        docs={pages}
        docsCount={pages.length}
        projectsCount={projects.length}
        tasksCount={tasks.length}
        membersCount={members.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(true)}
        onNewDoc={() => setIsNewDocOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content Workspace Area */}
      <main className="affine-main">
        <AffineHeader
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          title={workspaceName === "Demo Workspace" ? "Video Editing Deadlines" : navTitles[activeNav]}
          role={role}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(false)}
        />

        <div className="affine-scroll-area">
          <div style={{ maxWidth: "100%", margin: "0 auto", padding: "20px 44px 100px", width: "100%" }}>
            {/* View 1: Notion Database Homepage (Matches Reference Screenshot) */}
            {activeNav === "docs" && (
              <NotionDatabaseView
                workspaceId={workspaceId}
                workspaceName={workspaceName}
                role={role}
                isOwner={isOwner}
                tasks={tasks}
                projects={projects}
                members={members}
                onNewDocClick={() => setIsNewDocOpen(true)}
              />
            )}

            {/* View 2: Projects */}
            {activeNav === "projects" && (
              <ProjectManager
                workspaceId={workspaceId}
                initialProjects={projects}
                role={role}
              />
            )}

            {/* View 3: Tasks */}
            {activeNav === "tasks" && (
              <TaskBoard
                workspaceId={workspaceId}
                initialTasks={tasks}
                members={taskMembers}
                projects={taskProjects}
                role={role}
              />
            )}

            {/* View 4: Team */}
            {activeNav === "team" && (
              <TeamTab
                workspaceId={workspaceId}
                isOwner={isOwner}
                initialMembers={members}
              />
            )}
          </div>
        </div>
      </main>

      {/* New Document Modal */}
      {isNewDocOpen ? (
        <div className="modal-backdrop" onClick={() => setIsNewDocOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Document</h3>
              <button
                type="button"
                onClick={() => setIsNewDocOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <CreatePageForm workspaceId={workspaceId} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating Bottom-Left Language Banner (matches user reference screenshot) */}
      {showLangPrompt && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: isSidebarCollapsed ? 24 : 276,
            background: "#202020",
            border: "1px solid #333333",
            borderRadius: 8,
            padding: "12px 14px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            zIndex: 40,
            maxWidth: 260,
            fontSize: "0.8rem",
            color: "#e0e0e0",
            transition: "left 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.78rem" }}>
              Use Notion in your preferred language
            </span>
            <button
              type="button"
              onClick={() => setShowLangPrompt(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#777",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.8rem",
              }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: "0 0 8px", color: "#8c8c8c", fontSize: "0.74rem", lineHeight: 1.35 }}>
            Find the language you love. Try English (UK) now
          </p>
          <div style={{ textAlign: "right" }}>
            <button
              type="button"
              onClick={() => setShowLangPrompt(false)}
              style={{
                background: "#282828",
                border: "1px solid #3c3c3c",
                color: "#ffffff",
                padding: "3px 9px",
                borderRadius: 4,
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Go to Settings
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Help Button (matches user reference screenshot) */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "#ffffff",
          color: "#181818",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "0.95rem",
          zIndex: 40,
        }}
        title="Help & Support"
      >
        🪶
      </div>
    </div>
  );
}
