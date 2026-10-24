import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canComment, canEdit, canView, jsonError } from "@/lib/roles";

export type { Role };
export { canComment, canEdit, canView, jsonError };

export async function getWorkspaceRole(
  userId: string,
  workspaceId: string,
): Promise<Role | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  return membership?.role ?? null;
}

export async function getPageAccess(userId: string, pageId: string) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { workspace: true },
  });
  if (!page) {
    return { page: null, role: null as Role | null };
  }
  const role = await getWorkspaceRole(userId, page.workspaceId);
  return { page, role };
}

export async function getProjectAccess(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: true },
  });
  if (!project) {
    return { project: null, role: null as Role | null };
  }
  const role = await getWorkspaceRole(userId, project.workspaceId);
  return { project, role };
}

export async function getTaskAccess(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { workspace: true, project: true },
  });
  if (!task) {
    return { task: null, role: null as Role | null };
  }
  const role = await getWorkspaceRole(userId, task.workspaceId);
  return { task, role };
}
