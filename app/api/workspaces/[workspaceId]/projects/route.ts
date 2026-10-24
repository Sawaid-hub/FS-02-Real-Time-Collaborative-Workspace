import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, canView, getWorkspaceRole, jsonError } from "@/lib/permissions";
import { ProjectStatus } from "@prisma/client";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(1000).optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
});

export async function GET(
  _request: Request,
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

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { tasks: true, files: true, pages: true },
      },
      tasks: {
        select: { id: true, status: true },
      },
      files: {
        select: { id: true, name: true, size: true, mimeType: true, fileUrl: true, createdAt: true },
      },
    },
  });

  return Response.json({ projects });
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
    return jsonError("FORBIDDEN", "Edit permission required to create projects.", 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", parsed.error.issues[0]?.message || "Invalid input.", 400);
  }

  const project = await prisma.project.create({
    data: {
      workspaceId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      status: parsed.data.status,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
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

  return Response.json({ project }, { status: 201 });
}
