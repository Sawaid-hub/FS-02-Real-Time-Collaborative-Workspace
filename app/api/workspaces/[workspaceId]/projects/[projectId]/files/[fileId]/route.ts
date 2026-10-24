import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, getProjectAccess, jsonError } from "@/lib/permissions";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string; fileId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { projectId, fileId } = await context.params;
  const { project, role } = await getProjectAccess(session.user.id, projectId);
  if (!project) {
    return jsonError("NOT_FOUND", "Project not found.", 404);
  }
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Edit permission required to delete project files.", 403);
  }

  const file = await prisma.projectFile.findUnique({
    where: { id: fileId },
  });
  if (!file || file.projectId !== projectId) {
    return jsonError("NOT_FOUND", "File not found.", 404);
  }

  // Attempt to remove physical file if it starts with /uploads/
  if (file.fileUrl.startsWith("/uploads/")) {
    const filename = file.fileUrl.replace("/uploads/", "");
    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    await unlink(filePath).catch(() => {});
  }

  await prisma.projectFile.delete({
    where: { id: fileId },
  });

  return Response.json({ ok: true });
}
