import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, canView, getProjectAccess, jsonError } from "@/lib/permissions";
import { ProjectStatus } from "@prisma/client";

const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { projectId } = await context.params;
  const { project, role } = await getProjectAccess(session.user.id, projectId);
  if (!project || !canView(role)) {
    return jsonError("NOT_FOUND", "Project not found.", 404);
  }

  const detailedProject = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        orderBy: { position: "asc" },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
        },
      },
      files: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
      },
      pages: {
        select: { id: true, title: true, updatedAt: true },
      },
      _count: {
        select: { tasks: true, files: true, pages: true },
      },
    },
  });

  return Response.json({ project: detailedProject });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { projectId } = await context.params;
  const { project, role } = await getProjectAccess(session.user.id, projectId);
  if (!project) {
    return jsonError("NOT_FOUND", "Project not found.", 404);
  }
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Edit permission required to update project.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", parsed.error.issues[0]?.message || "Invalid input.", 400);
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.startDate !== undefined
        ? { startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null }
        : {}),
      ...(parsed.data.targetDate !== undefined
        ? { targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null }
        : {}),
    },
    include: {
      _count: {
        select: { tasks: true, files: true, pages: true },
      },
      tasks: {
        select: { id: true, status: true },
      },
      files: true,
    },
  });

  return Response.json({ project: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { projectId } = await context.params;
  const { project, role } = await getProjectAccess(session.user.id, projectId);
  if (!project) {
    return jsonError("NOT_FOUND", "Project not found.", 404);
  }
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Edit permission required to delete project.", 403);
  }

  await prisma.project.delete({ where: { id: projectId } });
  return Response.json({ ok: true });
}
