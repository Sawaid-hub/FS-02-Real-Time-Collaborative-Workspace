import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, canView, getWorkspaceRole, jsonError } from "@/lib/permissions";
import { TaskPriority, TaskStatus } from "@prisma/client";

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  position: z.number().optional().default(0),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { workspaceId } = await context.params;
  const role = await getWorkspaceRole(session.user.id, workspaceId);
  if (!canView(role)) {
    return jsonError("NOT_FOUND", "Workspace not found.", 404);
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const statusParam = searchParams.get("status") as TaskStatus | null;
  const assigneeId = searchParams.get("assigneeId");

  const whereClause: any = { workspaceId };
  if (projectId) {
    whereClause.projectId = projectId;
  }
  if (statusParam && Object.values(TaskStatus).includes(statusParam)) {
    whereClause.status = statusParam;
  }
  if (assigneeId) {
    whereClause.assigneeId = assigneeId;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, status: true } },
    },
  });

  return Response.json({ tasks });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { workspaceId } = await context.params;
  const role = await getWorkspaceRole(session.user.id, workspaceId);
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Edit permission required to create tasks.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", parsed.error.issues[0]?.message || "Invalid input.", 400);
  }

  // If projectId is provided, check that project belongs to this workspace
  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, workspaceId },
    });
    if (!project) {
      return jsonError("NOT_FOUND", "Project not found in this workspace.", 404);
    }
  }

  // Calculate position if not specified: place at end of status column
  let position = parsed.data.position;
  if (!position) {
    const highest = await prisma.task.findFirst({
      where: { workspaceId, status: parsed.data.status },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    position = (highest?.position ?? 0) + 1000;
  }

  const task = await prisma.task.create({
    data: {
      workspaceId,
      projectId: parsed.data.projectId || null,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assigneeId: parsed.data.assigneeId || null,
      creatorId: session.user.id,
      position,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, status: true } },
    },
  });

  return Response.json({ task }, { status: 201 });
}
