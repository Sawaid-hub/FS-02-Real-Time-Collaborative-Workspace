"use client";

import { FormEvent, useEffect, useState } from "react";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
};

export function CommentPanel({ pageId, canWrite }: { pageId: string; canWrite: boolean }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch(`/api/pages/${pageId}/comments`);
    if (!response.ok) return;
    const data = (await response.json()) as { comments: Comment[] };
    setComments(data.comments);
  }

  useEffect(() => {
    void load();
  }, [pageId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    const response = await fetch(`/api/pages/${pageId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!response.ok) {
      setError("Could not add comment.");
      return;
    }
    form.reset();
    await load();
  }

  return (
    <div className="side-card">
      <h3>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Comments
        </span>
        <span className="status-pill" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
          {comments.length}
        </span>
      </h3>
      {canWrite ? (
        <form className="grid" onSubmit={onSubmit} style={{ marginBottom: 16 }}>
          <textarea
            name="body"
            rows={3}
            required
            placeholder="Share feedback or add a note…"
            style={{ fontSize: "0.88rem" }}
          />
          <button className="btn accent" type="submit" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            Post Comment
          </button>
        </form>
      ) : (
        <p className="muted" style={{ fontSize: "0.85rem" }}>Viewers cannot comment.</p>
      )}
      {error ? <p className="error">{error}</p> : null}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {comments.length === 0 ? (
          <p className="muted" style={{ fontSize: "0.85rem", textAlign: "center", padding: "12px 0" }}>
            No comments yet.
          </p>
        ) : (
          comments.map((comment) => (
            <div className="comment" key={comment.id}>
              <div className="comment-author">
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  }}
                >
                  {comment.author.name.slice(0, 1).toUpperCase()}
                </span>
                <span>{comment.author.name}</span>
                <span className="comment-time">
                  · {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="comment-body">{comment.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
