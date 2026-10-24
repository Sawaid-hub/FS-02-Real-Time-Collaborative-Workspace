import { auth } from "@/lib/auth";
import { mintCollabToken } from "@/lib/collab/token";
import { roomNameForPage } from "@/lib/collab/rooms";
import { canView, getPageAccess, jsonError } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("UNAUTHENTICATED", "Sign in required.", 401);
  }
  const pageId = new URL(request.url).searchParams.get("pageId");
  if (!pageId) {
    return jsonError("INVALID", "pageId is required.", 400);
  }
  const { page, role } = await getPageAccess(session.user.id, pageId);
  if (!page || !role || !canView(role)) {
    return jsonError("NOT_FOUND", "Page not found.", 404);
  }
  const token = await mintCollabToken({
    sub: session.user.id,
    pageId,
    role,
    name: session.user.name ?? "User",
  });
  return Response.json({
    token,
    room: roomNameForPage(pageId),
    role,
  });
}
