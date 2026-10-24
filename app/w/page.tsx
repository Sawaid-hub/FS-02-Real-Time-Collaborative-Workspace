import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignOutButton } from "@/components/sign-out-button";
import { CreateWorkspaceForm } from "@/components/create-workspace-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function WorkspacesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaces = await prisma.workspace.findMany({
    where: { memberships: { some: { userId: session.user.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          pages: true,
          projects: true,
          tasks: true,
          memberships: true,
        },
      },
      memberships: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--affine-canvas-bg, #f8fafc)" }}>
      {/* AFFiNE Top Navigation */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: "1px solid var(--affine-border, #e2e8f0)",
          background: "var(--affine-card-bg, #ffffff)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #1e96eb 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.95rem",
              boxShadow: "0 2px 8px rgba(30, 150, 235, 0.3)",
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--affine-ink, #0f172a)" }}>
              AFFiNE Workspaces
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--affine-muted, #64748b)" }}>
              Signed in as <strong>{session.user.name ?? session.user.email}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1080, width: "100%", margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Welcome & Create Section */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 20,
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: "1px solid var(--affine-border, #e2e8f0)",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: "1.85rem", fontWeight: 800, color: "var(--affine-ink, #0f172a)" }}>
              Your Workspaces
            </h1>
            <p style={{ margin: 0, color: "var(--affine-muted, #64748b)", fontSize: "0.95rem" }}>
              Select an existing workspace or create a new one to collaborate in real-time.
            </p>
          </div>

          <div style={{ minWidth: 280 }}>
            <CreateWorkspaceForm />
          </div>
        </div>

        {/* Workspace Cards Grid */}
        {workspaces.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              background: "var(--affine-card-bg, #ffffff)",
              border: "1px solid var(--affine-border, #e2e8f0)",
              borderRadius: "var(--radius-lg, 16px)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📁</div>
            <h3 style={{ margin: "0 0 6px", color: "var(--affine-ink, #0f172a)" }}>No workspaces found</h3>
            <p style={{ margin: 0, color: "var(--affine-muted, #64748b)", fontSize: "0.9rem" }}>
              Use the form above to create your first collaborative workspace.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            {workspaces.map((ws) => {
              const myRole = ws.memberships[0]?.role ?? "VIEW";
              const isOwner = ws.ownerId === session.user?.id;

              return (
                <Link
                  key={ws.id}
                  href={`/w/${ws.id}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "22px 24px",
                    background: "var(--affine-card-bg, #ffffff)",
                    border: "1px solid var(--affine-border, #e2e8f0)",
                    borderRadius: "var(--radius-lg, 16px)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                  className="affine-canvas-card"
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "linear-gradient(135deg, #1e96eb 0%, #7c3aed 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: "1rem",
                        }}
                      >
                        {ws.name.slice(0, 2).toUpperCase()}
                      </div>

                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: isOwner ? "#fef3c7" : "var(--affine-border-subtle, #f1f5f9)",
                          color: isOwner ? "#b45309" : "var(--affine-ink-secondary, #475569)",
                        }}
                      >
                        {isOwner ? "👑 OWNER" : myRole}
                      </span>
                    </div>

                    <h2 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 700, color: "var(--affine-ink, #0f172a)" }}>
                      {ws.name}
                    </h2>
                    <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--affine-muted, #64748b)" }}>
                      Created {new Date(ws.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        paddingTop: 12,
                        borderTop: "1px solid var(--affine-border-subtle, #f1f5f9)",
                        fontSize: "0.78rem",
                        color: "var(--affine-muted, #64748b)",
                      }}
                    >
                      <span>📄 {ws._count.pages} {ws._count.pages === 1 ? "doc" : "docs"}</span>
                      <span>📁 {ws._count.projects} {ws._count.projects === 1 ? "project" : "projects"}</span>
                      <span>📋 {ws._count.tasks} {ws._count.tasks === 1 ? "task" : "tasks"}</span>
                      <span>👥 {ws._count.memberships}</span>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "var(--affine-primary, #1e96eb)",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      <span>Open Workspace</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
