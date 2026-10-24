import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <div className="card">
        <h1>Not found</h1>
        <p className="muted">That workspace or page is missing, or you do not have access.</p>
        <Link className="btn" href="/w">
          Back to workspaces
        </Link>
      </div>
    </main>
  );
}
