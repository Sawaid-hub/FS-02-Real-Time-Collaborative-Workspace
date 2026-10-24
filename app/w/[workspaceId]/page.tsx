import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canView, getWorkspaceRole } from "@/lib/permissions";
import { AffineWorkspaceView } from "@/components/affine-workspace-view";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const { workspaceId } = await params;
  const role = await getWorkspaceRole(session.user.id, workspaceId);
  if (!canView(role)) {
    notFound();
  }
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      pages: { orderBy: { updatedAt: "desc" } },
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      projects: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { tasks: true, files: true, pages: true } },
          tasks: { select: { id: true, status: true } },
          files: {
            orderBy: { createdAt: "desc" },
            include: {
              uploadedBy: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      tasks: {
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });
  if (!workspace) {
    notFound();
  }
  const isOwner = workspace.ownerId === session.user.id;

  const serializedPages = workspace.pages.map((p) => ({
    id: p.id,
    title: p.title,
    updatedAt: p.updatedAt.toISOString(),
  }));

  const serializedProjects = workspace.projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    targetDate: p.targetDate ? p.targetDate.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    _count: p._count,
    tasks: p.tasks.map((t) => ({ id: t.id, status: t.status })),
    files: p.files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      fileUrl: f.fileUrl,
      createdAt: f.createdAt.toISOString(),
      uploadedBy: f.uploadedBy,
    })),
  }));

  const serializedTasks = workspace.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    position: t.position,
    assignee: t.assignee,
    creator: t.creator,
    project: t.project,
    createdAt: t.createdAt.toISOString(),
  }));

  const serializedMembers = workspace.memberships.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    isOwner: m.user.id === workspace.ownerId,
  }));

  return (
    <AffineWorkspaceView
      workspaceId={workspaceId}
      workspaceName={workspace.name}
      role={role}
      isOwner={isOwner}
      pages={serializedPages}
      projects={serializedProjects}
      tasks={serializedTasks}
      members={serializedMembers}
      userName={session.user.name || "User"}
      userEmail={session.user.email || ""}
    />
  );
}

