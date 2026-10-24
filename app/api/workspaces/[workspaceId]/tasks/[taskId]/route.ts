import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, canView, getTaskAccess, jsonError } from "@/lib/permissions";
import { TaskPriority, TaskStatus } from "@prisma/client";

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  position: z.number().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; taskId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { taskId } = await context.params;
  const { task, role } = await getTaskAccess(session.user.id, taskId);
  if (!task || !canView(role)) {
    return jsonError("NOT_FOUND", "Task not found.", 404);
  }

  const detailedTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, status: true } },
    },
  });

  return Response.json({ task: detailedTask });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string; taskId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { taskId } = await context.params;
  const { task, role } = await getTaskAccess(session.user.id, taskId);
  if (!task) {
    return jsonError("NOT_FOUND", "Task not found.", 404);
  }
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Edit permission required to update tasks.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", parsed.error.issues[0]?.message || "Invalid input.", 400);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.dueDate !== undefined
        ? { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }
        : {}),
      ...(parsed.data.assigneeId !== undefined ? { assigneeId: parsed.data.assigneeId } : {}),
      ...(parsed.data.projectId !== undefined ? { projectId: parsed.data.projectId } : {}),
      ...(parsed.data.position !== undefined ? { position: parsed.data.position } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, status: true } },
    },
  });

  return Response.json({ task: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; taskId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { taskId } = await context.params;
  const { task, role } = await getTaskAccess(session.user.id, taskId);
  if (!task) {
    return jsonError("NOT_FOUND", "Task not found.", 404);
  }
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Edit permission required to delete tasks.", 403);
  }

  await prisma.task.delete({ where: { id: taskId } });
  return Response.json({ ok: true });
}
