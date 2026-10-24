import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/permissions";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const workspaces = await prisma.workspace.findMany({
    where: { memberships: { some: { userId: session.user.id } } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { pages: true, memberships: true } } },
  });
  return Response.json({ workspaces });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("INVALID", "Workspace name is required.", 400);
  }
  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      ownerId: session.user.id,
      memberships: {
        create: { userId: session.user.id, role: "EDIT" },
      },
    },
  });
  return Response.json({ workspace });
}
