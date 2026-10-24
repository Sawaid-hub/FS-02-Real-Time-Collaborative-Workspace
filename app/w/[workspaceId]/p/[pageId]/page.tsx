import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mintCollabToken } from "@/lib/collab/token";
import { canView, getPageAccess } from "@/lib/permissions";
import { AffineEditorView } from "@/components/affine-editor-view";

export default async function PageEditorRoute({
  params,
}: {
  params: Promise<{ workspaceId: string; pageId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const { workspaceId, pageId } = await params;
  const { page, role } = await getPageAccess(session.user.id, pageId);
  if (!page || !role || !canView(role) || page.workspaceId !== workspaceId) {
    notFound();
  }
  const token = await mintCollabToken({
    sub: session.user.id,
    pageId,
    role,
    name: session.user.name ?? "User",
  });

  const allPages = await prisma.page.findMany({
    where: { workspaceId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });

  const isOwner = page.workspace.ownerId === session.user.id;

  return (
    <Suspense fallback={<p className="muted" style={{ padding: 24 }}>Loading editor…</p>}>
      <AffineEditorView
        pageId={page.id}
        title={page.title}
        workspaceId={workspaceId}
        workspaceName={page.workspace.name}
        role={role}
        userId={session.user.id}
        userName={session.user.name ?? "User"}
        token={token}
        allPages={allPages}
        isOwner={isOwner}
      />
    </Suspense>
  );
}
