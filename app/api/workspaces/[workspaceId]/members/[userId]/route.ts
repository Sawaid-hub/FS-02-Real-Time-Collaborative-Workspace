import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/permissions";

const schema = z.object({
  role: z.enum(["VIEW", "COMMENT", "EDIT"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { workspaceId, userId } = await context.params;
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return jsonError("NOT_FOUND", "Workspace not found.", 404);
  }
  if (workspace.ownerId !== session.user.id) {
    return jsonError("FORBIDDEN", "Only the owner can change roles.", 403);
  }
  if (userId === workspace.ownerId) {
    return jsonError("FORBIDDEN", "The owner role cannot be changed.", 403);
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", "Role is required.", 400);
  }
  const membership = await prisma.membership.update({
    where: { userId_workspaceId: { userId, workspaceId } },
    data: { role: parsed.data.role },
  });
  return Response.json({ membership });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { workspaceId, userId } = await context.params;
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return jsonError("NOT_FOUND", "Workspace not found.", 404);
  }
  if (workspace.ownerId !== session.user.id) {
    return jsonError("FORBIDDEN", "Only the owner can remove members.", 403);
  }
  if (userId === workspace.ownerId) {
    return jsonError("FORBIDDEN", "The owner cannot be removed.", 403);
  }
  await prisma.membership.delete({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  return Response.json({ ok: true });
}
