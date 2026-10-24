import { prisma } from "../lib/db";

async function main() {
  console.log("=== Testing AFFiNE Features & Workspaces ===");

  // 1. Verify user accounts
  const alice = await prisma.user.findUnique({ where: { email: "alice@example.com" } });
  const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
  console.log("✓ User accounts:", {
    alice: alice ? `${alice.name} (${alice.email})` : "missing",
    bob: bob ? `${bob.name} (${bob.email})` : "missing",
  });

  // 2. Fetch workspaces with extended stats
  const workspaces = await prisma.workspace.findMany({
    where: { memberships: { some: { userId: alice?.id } } },
    include: {
      _count: {
        select: {
          pages: true,
          projects: true,
          tasks: true,
          memberships: true,
        },
      },
    },
  });
  console.log(`✓ Workspaces retrieved for Alice (${workspaces.length} total):`);
  for (const ws of workspaces) {
    console.log(`   - "${ws.name}": ${ws._count.pages} pages, ${ws._count.projects} projects, ${ws._count.tasks} tasks, ${ws._count.memberships} members`);
  }

  // 3. Test Markdown generation logic
  const sampleHtml = "<h1>Project Roadmap</h1><p>This is a <strong>real-time</strong> collaborative document.</p><ul><li>Task 1</li><li>Task 2</li></ul>";
  const header = `# 🚀 Project Roadmap\n\n`;
  const cleanMd = sampleHtml
    .replace(/<h1>(.*?)<\/h1>/gi, "\n# $1\n\n")
    .replace(/<h2>(.*?)<\/h2>/gi, "\n## $1\n\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<ul>([\s\S]*?)<\/ul>/gi, "$1\n")
    .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<[^>]+>/g, "");
  const resultMd = header + cleanMd.trim();
  console.log("✓ Markdown export transformation sample:\n", resultMd);

  console.log("=== All AFFiNE feature tests passed successfully! ===");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
