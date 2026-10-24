import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEdit, canView, getProjectAccess, jsonError } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { projectId } = await context.params;
  const { project, role } = await getProjectAccess(session.user.id, projectId);
  if (!project || !canView(role)) {
    return jsonError("NOT_FOUND", "Project not found.", 404);
  }

  const files = await prisma.projectFile.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json({ files });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string; projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const { projectId } = await context.params;
  const { project, role } = await getProjectAccess(session.user.id, projectId);
  if (!project) {
    return jsonError("NOT_FOUND", "Project not found.", 404);
  }
  if (!canEdit(role)) {
    return jsonError("FORBIDDEN", "Edit permission required to upload project files.", 403);
  }

  const contentType = request.headers.get("content-type") || "";

  let name = "";
  let size = 0;
  let mimeType = "application/octet-stream";
  let fileUrl = "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return jsonError("INVALID", "No file uploaded.", 400);
    }

    name = file.name;
    size = file.size;
    mimeType = file.type || "application/octet-stream";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);
    await writeFile(filePath, buffer);

    fileUrl = `/uploads/${safeName}`;
  } else {
    const body = await request.json().catch(() => null);
    if (!body?.name || !body?.fileUrl) {
      return jsonError("INVALID", "File name and URL are required.", 400);
    }
    name = body.name;
    size = Number(body.size) || 0;
    mimeType = body.mimeType || "application/octet-stream";
    fileUrl = body.fileUrl;
  }

  const projectFile = await prisma.projectFile.create({
    data: {
      projectId,
      name,
      size,
      mimeType,
      fileUrl,
      uploadedById: session.user.id,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json({ file: projectFile }, { status: 201 });
}
