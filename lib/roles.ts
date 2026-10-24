export type Role = "VIEW" | "COMMENT" | "EDIT";

export function canView(role: Role | null | undefined): role is Role {
  return role === "VIEW" || role === "COMMENT" || role === "EDIT";
}

export function canComment(role: Role | null | undefined): role is "COMMENT" | "EDIT" {
  return role === "COMMENT" || role === "EDIT";
}

export function canEdit(role: Role | null | undefined): role is "EDIT" {
  return role === "EDIT";
}

export function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
