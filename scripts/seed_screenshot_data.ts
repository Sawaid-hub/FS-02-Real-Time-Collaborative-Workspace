import { prisma } from "../lib/db";

async function main() {
  console.log("Seeding sample data matching user reference screenshot...");

  const user = await prisma.user.findFirst({ where: { email: "alice@example.com" } });
  if (!user) {
    console.error("Alice not found.");
    return;
  }

  const workspace = await prisma.workspace.findFirst({
    where: { memberships: { some: { userId: user.id } } },
    include: { tasks: true },
  });

  if (!workspace) {
    console.error("Workspace not found.");
    return;
  }

  // Check if "owl coart" already exists
  const existing = workspace.tasks.find((t) => t.title.toLowerCase().includes("owl coart"));
  if (!existing) {
    await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: "owl coart",
        description: "Client: Abdullah",
        dueDate: new Date("2025-06-16T12:00:00Z"),
        status: "IN_REVIEW",
        priority: "URGENT",
        creatorId: user.id,
        assigneeId: user.id,
      },
    });
    console.log("✓ Created 'owl coart' task matching reference screenshot.");
  } else {
    console.log("✓ 'owl coart' task already exists.");
  }

  // Set workspace name to "Video Editing Deadlines" if it's currently "Demo Workspace"
  if (workspace.name === "Demo Workspace") {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { name: "Video Editing Deadlines" },
    });
    console.log("✓ Renamed workspace to 'Video Editing Deadlines' matching reference screenshot.");
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
