import { prisma } from "../lib/db";

async function main() {
  const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
  const ws = await prisma.workspace.findFirst();
  if (bob && ws) {
    const m = await prisma.membership.upsert({
      where: { userId_workspaceId: { userId: bob.id, workspaceId: ws.id } },
      create: { userId: bob.id, workspaceId: ws.id, role: "EDIT" },
      update: { role: "EDIT" },
    });
    console.log("SUCCESS: Bob joined workspace", ws.name, "with role", m.role);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
