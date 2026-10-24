import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, canView, getPageAccess, jsonError } from "@/lib/permissions";

const schema = z.object({
  label: z.string().trim().min(1).max(120),
  yDocBase64: z.string().min(1),
  previewHtml: z.string().max(200_000).optional(),
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
  const snapshots = await prisma.snapshot.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });
  return Response.json({
    snapshots: snapshots.map((s) => ({
      id: s.id,
      label: s.label,
      createdAt: s.createdAt,
      author: s.author,
      previewHtml: s.previewHtml,
    })),
  });
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
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Editors can save snapshots.", 403);
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", "Label and document bytes are required.", 400);
  }
  const snapshot = await prisma.snapshot.create({
    data: {
      pageId,
      authorId: session.user.id,
      label: parsed.data.label,
      yDoc: Buffer.from(parsed.data.yDocBase64, "base64"),
      previewHtml: parsed.data.previewHtml,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  return Response.json({
    snapshot: {
      id: snapshot.id,
      label: snapshot.label,
      createdAt: snapshot.createdAt,
      author: snapshot.author,
      previewHtml: snapshot.previewHtml,
    },
  });
}
