import { prisma } from "../lib/db";
import { mintCollabToken } from "../lib/collab/token";
import { getProjectAccess, getTaskAccess, getPageAccess } from "../lib/permissions";

async function runTests() {
  console.log("=== Running Comprehensive AFFiNE Workspace & Features Integration Tests ===");

  // 1. Check Alice and Bob
  const alice = await prisma.user.findUnique({ where: { email: "alice@example.com" } });
  const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
  if (!alice) throw new Error("Alice not found");
  if (!bob) throw new Error("Bob not found");
  console.log(`✓ Users verified: Alice (${alice.id}), Bob (${bob.id})`);

  // 2. Check Workspace
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: alice.id },
    include: {
      pages: true,
      projects: true,
      tasks: true,
      memberships: true,
    },
  });
  if (!workspace) throw new Error("Workspace not found");
  console.log(`✓ Workspace verified: "${workspace.name}" (ID: ${workspace.id})`);

  // 3. Test Project Creation & Access
  let testProject = await prisma.project.findFirst({
    where: { workspaceId: workspace.id, name: "AFFiNE Migration Project" },
  });
  if (!testProject) {
    testProject = await prisma.project.create({
      data: {
        workspaceId: workspace.id,
        name: "AFFiNE Migration Project",
        description: "Replicating AFFiNE UI, sidebar, layout, and topbar",
        status: "ACTIVE",
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✓ Created Project: "${testProject.name}" (Status: ${testProject.status})`);
  } else {
    console.log(`✓ Found Project: "${testProject.name}" (Status: ${testProject.status})`);
  }

  const aliceProjectAccess = await getProjectAccess(alice.id, testProject.id);
  console.log(`✓ Alice Project Access Role: ${aliceProjectAccess.role}`);
  if (aliceProjectAccess.role !== "EDIT") {
    throw new Error("Expected Alice to have EDIT role on project");
  }

  // 4. Test Task Creation & Access
  let testTask = await prisma.task.findFirst({
    where: { workspaceId: workspace.id, title: "Verify AFFiNE Sidebar Navigation" },
  });
  if (!testTask) {
    testTask = await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        projectId: testProject.id,
        title: "Verify AFFiNE Sidebar Navigation",
        description: "Test collapsible sidebar with All Docs, Projects, Tasks, and Team",
        status: "IN_PROGRESS",
        priority: "HIGH",
        creatorId: alice.id,
        assigneeId: alice.id,
      },
    });
    console.log(`✓ Created Task: "${testTask.title}" (Status: ${testTask.status}, Priority: ${testTask.priority})`);
  } else {
    console.log(`✓ Found Task: "${testTask.title}" (Status: ${testTask.status})`);
  }

  const taskAccess = await getTaskAccess(alice.id, testTask.id);
  console.log(`✓ Task Access Role: ${taskAccess.role}`);

  // Test Task Status Movement
  const updatedTask = await prisma.task.update({
    where: { id: testTask.id },
    data: { status: "DONE" },
  });
  console.log(`✓ Task Status Updated to: ${updatedTask.status}`);

  // 5. Test Project File Creation
  let testFile = await prisma.projectFile.findFirst({
    where: { projectId: testProject.id, name: "affine_spec.pdf" },
  });
  if (!testFile) {
    testFile = await prisma.projectFile.create({
      data: {
        projectId: testProject.id,
        name: "affine_spec.pdf",
        size: 1048576, // 1MB
        mimeType: "application/pdf",
        fileUrl: "/uploads/affine_spec.pdf",
        uploadedById: alice.id,
      },
    });
    console.log(`✓ Created Project File: "${testFile.name}" (${testFile.size} bytes)`);
  } else {
    console.log(`✓ Found Project File: "${testFile.name}"`);
  }

  // 6. Test Page Access & Token Minting for Collaborative Editor
  const firstPage = workspace.pages[0];
  if (firstPage) {
    const pageAccess = await getPageAccess(alice.id, firstPage.id);
    console.log(`✓ Page Access for "${firstPage.title}": Role ${pageAccess.role}`);
    const token = await mintCollabToken({
      sub: alice.id,
      pageId: firstPage.id,
      role: pageAccess.role!,
      name: alice.name,
    });
    console.log(`✓ Collab Token Minted Successfully: length ${token.length}`);
  }

  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
