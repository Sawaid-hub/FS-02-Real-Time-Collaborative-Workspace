import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, canView, getWorkspaceRole, jsonError } from "@/lib/permissions";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
});

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
  if (!canView(role)) {
    return jsonError("NOT_FOUND", "Workspace not found.", 404);
  }
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Editors can create pages.", 403);
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", "Page title is required.", 400);
  }
  const page = await prisma.page.create({
    data: {
      workspaceId,
      title: parsed.data.title,
      yDoc: Buffer.alloc(0),
    },
  });
  return Response.json({ page });
}
