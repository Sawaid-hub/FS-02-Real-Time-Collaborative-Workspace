"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

export interface TeamMemberData {
  userId: string;
  name: string;
  email: string;
  role: Role;
  isOwner: boolean;
}

interface TeamTabProps {
  workspaceId: string;
  isOwner: boolean;
  initialMembers: TeamMemberData[];
}

export function TeamTab({ workspaceId, isOwner, initialMembers }: TeamTabProps) {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMemberData[]>(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("EDIT");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Member
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to add member");
      }

      setStatus(`Successfully added ${email} with ${role} permissions.`);
      setEmail("");
      router.refresh();

      // Refresh list
      const fetchRes = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (fetchRes.ok) {
        const json = await fetchRes.json();
        if (json.members) setMembers(json.members);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error adding member");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Change Role
  async function handleRoleChange(userId: string, nextRole: Role) {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update role");

      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: nextRole } : m))
      );
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating role");
    }
  }

  // Remove Member
  async function handleRemoveMember(userId: string, memberEmail: string) {
    if (!confirm(`Remove ${memberEmail} from this workspace?`)) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to remove member");

      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error removing member");
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Team Members</h2>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>
            Manage collaborators, assign workspace roles, and control access permissions.
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter team members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--line)",
            fontSize: "0.88rem",
            width: 220,
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isOwner ? "1.4fr 1fr" : "1fr", gap: 24, alignItems: "start" }}>
        {/* Members List */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--bg-subtle)" }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>
              Active Members ({filteredMembers.length})
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredMembers.map((member) => (
              <div
                key={member.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--line)",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{member.name}</span>
                      {member.isOwner ? (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "var(--radius-sm)",
                            background: "#fef3c7",
                            color: "#b45309",
                            border: "1px solid #fde68a",
                          }}
                        >
                          👑 OWNER
                        </span>
                      ) : null}
                    </div>
                    <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{member.email}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {isOwner && !member.isOwner ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as Role)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--line)",
                        background: "#fff",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                      }}
                    >
                      <option value="VIEW">VIEW (Read-only)</option>
                      <option value="COMMENT">COMMENT (Feedback only)</option>
                      <option value="EDIT">EDIT (Full access)</option>
                    </select>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--bg-hover)",
                        color: "var(--ink-secondary)",
                      }}
                    >
                      {member.role}
                    </span>
                  )}

                  {isOwner && !member.isOwner ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.userId, member.email)}
                      title="Remove Member"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger)",
                        cursor: "pointer",
                        fontSize: "1rem",
                        padding: "4px 8px",
                      }}
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Member Form (Owner only) */}
        {isOwner ? (
          <div className="card">
            <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>Invite Team Member</h3>
            <p className="muted" style={{ margin: "0 0 16px", fontSize: "0.85rem" }}>
              Add a registered user by email address to collaborate in this workspace.
            </p>

            {status ? <div className="alert alert-success">{status}</div> : null}
            {error ? <div className="alert alert-danger">{error}</div> : null}

            <form onSubmit={handleAddMember} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--line)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                  Permission Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--line)",
                    background: "#fff",
                  }}
                >
                  <option value="VIEW">VIEW — Read-only access</option>
                  <option value="COMMENT">COMMENT — Can view & add comments</option>
                  <option value="EDIT">EDIT — Can edit documents, manage tasks & files</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ marginTop: 6 }}
              >
                {isSubmitting ? "Inviting..." : "Add to Team"}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
