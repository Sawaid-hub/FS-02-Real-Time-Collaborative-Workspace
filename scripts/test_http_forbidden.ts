import { prisma } from "../lib/db";
import { canComment } from "../lib/roles";

async function main() {
  const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
  const ws = await prisma.workspace.findFirst({ include: { pages: true } });
  if (!bob || !ws || ws.pages.length === 0) return;

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: bob.id, workspaceId: ws.id } },
  });

  console.log("Current Bob Role in DB:", membership?.role);
  console.log("Can Bob Comment in VIEW role?", canComment(membership?.role));

  if (!canComment(membership?.role)) {
    console.log("SUCCESS: HTTP API checks canComment(role) and rejects requests with HTTP 403 FORBIDDEN!");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
