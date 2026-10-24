"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({
  style,
  compact = false,
}: {
  style?: React.CSSProperties;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Sign out"
        style={{
          background: "#2a2a2a",
          border: "1px solid #3c3c3c",
          borderRadius: 4,
          cursor: "pointer",
          padding: "3px 6px",
          color: "#999999",
          fontSize: "0.78rem",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          transition: "all 0.15s ease",
          ...style,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#333333";
          (e.currentTarget as HTMLElement).style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#2a2a2a";
          (e.currentTarget as HTMLElement).style.color = "#999999";
        }}
      >
        <span>⎋</span>
      </button>
    );
  }

  return (
    <button
      className="notion-btn-secondary"
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        background: "#282828",
        border: "1px solid #3c3c3c",
        color: "#e5e5e5",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: "0.82rem",
        cursor: "pointer",
        ...style,
      }}
    >
      Sign out
    </button>
  );
}
