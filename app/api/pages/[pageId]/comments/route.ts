import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canComment, canView, getPageAccess, jsonError } from "@/lib/permissions";

const schema = z.object({
  body: z.string().trim().min(1).max(4000),
  anchor: z.record(z.unknown()).optional(),
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
  const comments = await prisma.comment.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });
  return Response.json({ comments });
}

export async function POST(
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
  if (!canComment(role)) {
    return jsonError("FORBIDDEN", "Commenters and editors can add comments.", 403);
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", "Comment body is required.", 400);
  }
  const comment = await prisma.comment.create({
    data: {
      pageId,
      authorId: session.user.id,
      body: parsed.data.body,
      anchorJson: (parsed.data.anchor as Prisma.InputJsonValue) ?? undefined,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  return Response.json({ comment });
}
