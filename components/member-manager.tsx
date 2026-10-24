"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/roles";

type Member = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  isOwner: boolean;
};

export function MemberManager({
  workspaceId,
  isOwner,
  members,
}: {
  workspaceId: string;
  isOwner: boolean;
  members: Member[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: String(data.get("email") ?? ""),
        role: String(data.get("role") ?? "VIEW"),
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setError(payload?.error?.message ?? "Could not add member.");
      return;
    }
    form.reset();
    router.refresh();
  }

  async function changeRole(userId: string, role: Role) {
    await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.refresh();
  }

  async function remove(userId: string) {
    await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Team & Roles</h2>
        <span className="status-pill" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {members.map((member) => (
          <div
            key={member.userId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--line)",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: member.isOwner ? "var(--ink)" : "var(--accent)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {member.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>{member.name}</div>
                <div className="muted" style={{ fontSize: "0.78rem" }}>{member.email}</div>
              </div>
            </div>
            {isOwner && !member.isOwner ? (
              <div className="row" style={{ gap: 6 }}>
                <select
                  value={member.role}
                  onChange={(e) => changeRole(member.userId, e.target.value as Role)}
                  style={{ padding: "4px 8px", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
                >
                  <option value="VIEW">VIEW</option>
                  <option value="COMMENT">COMMENT</option>
                  <option value="EDIT">EDIT</option>
                </select>
                <button
                  className="btn danger"
                  type="button"
                  onClick={() => remove(member.userId)}
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <span className="status-pill" style={{ fontSize: "0.75rem", padding: "3px 10px" }}>
                {member.isOwner ? "Owner (Full Edit)" : member.role}
              </span>
            )}
          </div>
        ))}
      </div>
      {isOwner ? (
        <form className="grid" onSubmit={addMember} style={{ marginTop: 20 }}>
          <label style={{ fontSize: "0.82rem" }}>
            Invite Member by Email
            <input name="email" type="email" placeholder="colleague@example.com" required />
          </label>
          <div className="row" style={{ marginTop: 2 }}>
            <select name="role" defaultValue="VIEW" style={{ flex: 1, padding: "8px 12px" }}>
              <option value="VIEW">View Only</option>
              <option value="COMMENT">Can Comment</option>
              <option value="EDIT">Can Edit</option>
            </select>
            <button className="btn accent" type="submit" style={{ padding: "8px 16px" }}>
              Invite
            </button>
          </div>
          {error ? <p className="error">{error}</p> : null}
        </form>
      ) : (
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 14 }}>
          Only the workspace owner can invite or change member permissions.
        </p>
      )}
    </div>
  );
}
