"use client";

import { FormEvent, useEffect, useState } from "react";
import * as Y from "yjs";

type Snapshot = {
  id: string;
  label: string;
  createdAt: string;
  author: { name: string };
  previewHtml: string | null;
};

export function HistoryPanel({
  pageId,
  canSave,
  ydoc,
  previewHtml,
}: {
  pageId: string;
  canSave: boolean;
  ydoc: Y.Doc;
  previewHtml: string;
}) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<Snapshot | null>(null);

  async function load() {
    const response = await fetch(`/api/pages/${pageId}/snapshots`);
    if (!response.ok) return;
    const data = (await response.json()) as { snapshots: Snapshot[] };
    setSnapshots(data.snapshots);
  }

  useEffect(() => {
    void load();
  }, [pageId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = String(new FormData(event.currentTarget).get("label") ?? "Snapshot");
    const bytes = Y.encodeStateAsUpdate(ydoc);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const yDocBase64 = btoa(binary);
    const response = await fetch(`/api/pages/${pageId}/snapshots`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, yDocBase64, previewHtml }),
    });
    if (response.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  return (
    <div className="side-card">
      <h3>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>🕒</span> History
        </span>
        <span className="status-pill" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
          {snapshots.length}
        </span>
      </h3>
      {canSave ? (
        <form className="grid" onSubmit={onSubmit} style={{ marginBottom: 16 }}>
          <input
            name="label"
            placeholder="Label (e.g. v1.0 draft)"
            required
            style={{ fontSize: "0.88rem" }}
          />
          <button className="btn secondary" type="submit" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            Save Snapshot
          </button>
        </form>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {snapshots.length === 0 ? (
          <p className="muted" style={{ fontSize: "0.85rem", textAlign: "center", padding: "8px 0" }}>
            No saved snapshots yet.
          </p>
        ) : (
          snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              onClick={() => setSelected(selected?.id === snapshot.id ? null : snapshot)}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line)",
                background: selected?.id === snapshot.id ? "var(--bg-subtle)" : "#fff",
                cursor: "pointer",
                transition: "var(--transition)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--ink)" }}>
                  {snapshot.label}
                </span>
                <span className="muted" style={{ fontSize: "0.75rem" }}>
                  {selected?.id === snapshot.id ? "Hide ▲" : "Preview ▼"}
                </span>
              </div>
              <div className="muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>
                By {snapshot.author.name} · {new Date(snapshot.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
      {selected ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-secondary)" }}>
              Snapshot Preview: {selected.label}
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{ border: "none", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: "0.75rem" }}
            >
              ✕ Close
            </button>
          </div>
          <div className="preview" dangerouslySetInnerHTML={{ __html: selected.previewHtml ?? "<p>No preview</p>" }} />
        </div>
      ) : null}
    </div>
  );
}
