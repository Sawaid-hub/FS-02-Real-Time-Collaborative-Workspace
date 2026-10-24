"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setPending(false);
      setError(data?.error?.message ?? "Could not register.");
      return;
    }
    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Registered, but sign-in failed. Try the login page.");
      return;
    }
    router.push("/w");
    router.refresh();
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

      {/* Main Register Card */}
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
              Create your account
            </h1>
            <p style={{ margin: 0, color: "var(--affine-muted, #64748b)", fontSize: "0.92rem" }}>
              Start building collaborative spaces with real-time editing & tasks.
            </p>
          </div>

          <form className="grid" onSubmit={onSubmit} style={{ gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.88rem", fontWeight: 600, color: "var(--affine-ink, #0f172a)" }}>
              Full name
              <input
                name="name"
                required
                autoComplete="name"
                placeholder="Alice Smith"
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
              Email address
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="alice@example.com"
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
              Password (min 8 characters)
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
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
              {pending ? "Creating account…" : "Create Account & Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, marginBottom: 0, fontSize: "0.88rem", color: "var(--affine-muted, #64748b)" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--affine-primary, #1e96eb)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
