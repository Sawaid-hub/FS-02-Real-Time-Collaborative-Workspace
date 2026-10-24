import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

export type CollabTokenPayload = {
  sub: string;
  pageId: string;
  role: Role;
  name: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(value);
}

export async function mintCollabToken(payload: CollabTokenPayload) {
  return new SignJWT({
    pageId: payload.pageId,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret());
}

export async function verifyCollabToken(token: string): Promise<CollabTokenPayload> {
  const { payload } = await jwtVerify(token, secret());
  const pageId = payload.pageId;
  const role = payload.role;
  const name = payload.name;
  const sub = payload.sub;
  if (
    typeof pageId !== "string" ||
    typeof name !== "string" ||
    typeof sub !== "string" ||
    (role !== "VIEW" && role !== "COMMENT" && role !== "EDIT")
  ) {
    throw new Error("Invalid collab token");
  }
  return { sub, pageId, role, name };
}
