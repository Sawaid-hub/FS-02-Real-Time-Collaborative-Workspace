import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canView, getWorkspaceRole, jsonError } from "@/lib/permissions";

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
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      pages: { orderBy: { updatedAt: "desc" } },
      memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!workspace) {
    return jsonError("NOT_FOUND", "Workspace not found.", 404);
  }
  return Response.json({ workspace, role });
}
