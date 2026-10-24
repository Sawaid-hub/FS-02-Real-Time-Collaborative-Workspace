import { prisma } from "../lib/db";

async function main() {
  const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
  const ws = await prisma.workspace.findFirst();
  if (bob && ws) {
    await prisma.membership.update({
      where: { userId_workspaceId: { userId: bob.id, workspaceId: ws.id } },
      data: { role: "VIEW" },
    });
    console.log("Demoted Bob to VIEW role in database.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
