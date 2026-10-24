import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/permissions";

const schema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["VIEW", "COMMENT", "EDIT"]),
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
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return jsonError("NOT_FOUND", "Workspace not found.", 404);
  }
  if (workspace.ownerId !== session.user.id) {
    return jsonError("FORBIDDEN", "Only the owner can add members.", 403);
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", "Email and role are required.", 400);
  }
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) {
    return jsonError("NOT_FOUND", "No user with that email.", 404);
  }
  const membership = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    update: { role: parsed.data.role },
    create: { userId: user.id, workspaceId, role: parsed.data.role },
  });
  return Response.json({ membership });
}
