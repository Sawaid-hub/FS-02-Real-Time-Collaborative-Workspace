"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/w");
    router.refresh();
  }

  function fillDemo(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--affine-canvas-bg, #f8fafc)" }}>
      {/* Top Header */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--affine-ink, #0f172a)" }}>
            AFFiNE Workspace
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 4,
              background: "var(--affine-primary-subtle, rgba(30, 150, 235, 0.1))",
              color: "var(--affine-primary, #1e96eb)",
            }}
          >
            FS-02
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Login Card */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 440,
            width: "100%",
            padding: "36px 32px",
            background: "var(--affine-card-bg, #ffffff)",
            border: "1px solid var(--affine-border, #e2e8f0)",
            borderRadius: "var(--radius-lg, 16px)",
            boxShadow: "0 16px 40px -10px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #1e96eb 0%, #7c3aed 100%)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "1.4rem",
                boxShadow: "0 4px 14px rgba(30, 150, 235, 0.3)",
                marginBottom: 16,
              }}
            >
              ✦
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: "1.75rem", fontWeight: 800, color: "var(--affine-ink, #0f172a)" }}>
              Welcome back
            </h1>
            <p style={{ margin: 0, color: "var(--affine-muted, #64748b)", fontSize: "0.92rem" }}>
              Sign in to collaborate on documents, tasks, and projects.
            </p>
          </div>

          {/* Demo Login Quick Selectors */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md, 10px)",
              background: "var(--affine-border-subtle, #f1f5f9)",
              border: "1px solid var(--affine-border, #e2e8f0)",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--affine-muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              ⚡ Quick Demo Logins
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => fillDemo("alice@example.com", "password123")}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid var(--affine-border, #cbd5e1)",
                  background: "var(--affine-card-bg, #ffffff)",
                  color: "var(--affine-ink, #0f172a)",
                  cursor: "pointer",
                }}
              >
                👑 Alice (Owner)
              </button>
              <button
                type="button"
                onClick={() => fillDemo("bob@example.com", "password123")}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px solid var(--affine-border, #cbd5e1)",
                  background: "var(--affine-card-bg, #ffffff)",
                  color: "var(--affine-ink, #0f172a)",
                  cursor: "pointer",
                }}
              >
                👤 Bob (Editor)
              </button>
            </div>
          </div>

          <form className="grid" onSubmit={onSubmit} style={{ gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.88rem", fontWeight: 600, color: "var(--affine-ink, #0f172a)" }}>
              Email address
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--affine-border, #e2e8f0)",
                  background: "var(--affine-card-bg, #ffffff)",
                  color: "var(--affine-ink, #0f172a)",
                  outline: "none",
                  fontSize: "0.95rem",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.88rem", fontWeight: 600, color: "var(--affine-ink, #0f172a)" }}>
              Password
              <input
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--affine-border, #e2e8f0)",
                  background: "var(--affine-card-bg, #ffffff)",
                  color: "var(--affine-ink, #0f172a)",
                  outline: "none",
                  fontSize: "0.95rem",
                }}
              />
            </label>

            {error ? (
              <p
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "0.85rem",
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </p>
            ) : null}

            <button
              disabled={pending}
              type="submit"
              style={{
                marginTop: 6,
                padding: "12px",
                borderRadius: 8,
                background: "var(--affine-primary, #1e96eb)",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: pending ? "not-allowed" : "pointer",
                opacity: pending ? 0.7 : 1,
                boxShadow: "0 2px 8px rgba(30, 150, 235, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {pending ? "Signing in…" : "Sign In to Workspace"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, marginBottom: 0, fontSize: "0.88rem", color: "var(--affine-muted, #64748b)" }}>
            Don't have an account?{" "}
            <Link
              href="/register"
              style={{
                color: "var(--affine-primary, #1e96eb)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
