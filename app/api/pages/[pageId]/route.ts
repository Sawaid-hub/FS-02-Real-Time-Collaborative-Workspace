import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, canView, getPageAccess, jsonError } from "@/lib/permissions";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ pageId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { pageId } = await context.params;
  const { page, role } = await getPageAccess(session.user.id, pageId);
  if (!page || !canView(role)) {
    return jsonError("NOT_FOUND", "Page not found.", 404);
  }
  return Response.json({
    page: { id: page.id, title: page.title, workspaceId: page.workspaceId },
    role,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ pageId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { pageId } = await context.params;
  const { page, role } = await getPageAccess(session.user.id, pageId);
  if (!page || !canView(role)) {
    return jsonError("NOT_FOUND", "Page not found.", 404);
  }
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Editors can rename pages.", 403);
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", "Title is required.", 400);
  }
  const updated = await prisma.page.update({
    where: { id: pageId },
    data: { title: parsed.data.title },
  });
  return Response.json({ page: { id: updated.id, title: updated.title } });
}
