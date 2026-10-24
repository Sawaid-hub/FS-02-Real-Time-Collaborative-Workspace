"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Link from "@tiptap/extension-link";
import { canComment, canEdit, type Role } from "@/lib/roles";
import { roomNameForPage } from "@/lib/collab/rooms";
import { colorForUser, initials } from "@/lib/user-color";
import { CommentPanel } from "@/components/comment-panel";
import { HistoryPanel } from "@/components/history-panel";

type PresenceUser = { id: string; name: string; color: string };

export function CollaborativeEditor({
  pageId,
  title,
  workspaceId,
  role,
  userId,
  userName,
  token,
}: {
  pageId: string;
  title: string;
  workspaceId: string;
  role: Role;
  userId: string;
  userName: string;
  token: string;
}) {
  const searchParams = useSearchParams();
  const collabUrl = useMemo(() => {
    const port = searchParams.get("collabPort");
    if (port) {
      return `ws://localhost:${port}`;
    }
    let url = process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:1234";
    if (url && !url.startsWith("ws://") && !url.startsWith("wss://")) {
      url = `wss://${url}`;
    }
    return url;
  }, [searchParams]);

  const [status, setStatus] = useState("connecting");
  const [people, setPeople] = useState<PresenceUser[]>([]);
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const color = useMemo(() => colorForUser(userId), [userId]);
  const editable = canEdit(role);

  useEffect(() => {
    const room = roomNameForPage(pageId);
    const next = new WebsocketProvider(collabUrl, room, ydoc, {
      params: { token },
    });
    next.awareness.setLocalStateField("user", { id: userId, name: userName, color });
    const onStatus = (event: { status: string }) => setStatus(event.status);
    const onAwareness = () => {
      const seen = new Map<string, PresenceUser>();
      next.awareness.getStates().forEach((state) => {
        const user = (state as { user?: PresenceUser }).user;
        if (user?.id) {
          seen.set(user.id, user);
        }
      });
      setPeople([...seen.values()]);
    };
    next.on("status", onStatus);
    next.awareness.on("change", onAwareness);
    onAwareness();
    setProvider(next);
    return () => {
      next.off("status", onStatus);
      next.awareness.off("change", onAwareness);
      next.destroy();
      setProvider(null);
    };
  }, [collabUrl, color, pageId, token, userId, userName, ydoc]);

  const editor = useEditor(
    {
      editable,
      extensions: [
        StarterKit.configure({ history: false }),
        Link.configure({ openOnClick: false }),
        Collaboration.configure({ document: ydoc }),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider,
                user: { name: userName, color },
              }),
            ]
          : []),
      ],
    },
    [editable, provider, ydoc, userName, color],
  );

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  async function rename(nextTitle: string) {
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: nextTitle }),
    });
  }

  return (
    <div className="editor-layout">
      <div>
        <div className="editor-header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <span style={{ fontSize: "1.8rem" }}>📄</span>
            <input
              className="doc-title-input"
              defaultValue={title}
              disabled={!editable}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== title) {
                  void rename(e.target.value.trim());
                }
              }}
              placeholder="Untitled document"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="status-pill">
              <span className={`status-dot ${status}`} />
              {status} · {role}
            </span>
          </div>
        </div>

        <div className="presence" style={{ marginBottom: 14 }}>
          <span className="presence-label">
            {people.length > 0 ? `Active now (${people.length}):` : "Waiting for collaborators…"}
          </span>
          {people.map((person) => (
            <span
              key={person.id}
              className="avatar"
              style={{ background: person.color }}
              title={`${person.name} (${person.id === userId ? "You" : "Collaborator"})`}
            >
              {initials(person.name)}
            </span>
          ))}
        </div>

        <div className="editor-frame">
          {editable ? (
            <div className="toolbar">
              <button
                type="button"
                className={editor?.isActive("bold") ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                className={editor?.isActive("italic") ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                className={editor?.isActive("strike") ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                title="Strikethrough"
              >
                <s>S</s>
              </button>
              <button
                type="button"
                className={editor?.isActive("code") ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleCode().run()}
                title="Inline Code"
              >
                &lt;/&gt;
              </button>
              
              <div className="divider" />
              
              <button
                type="button"
                className={editor?.isActive("heading", { level: 1 }) ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
              >
                H1
              </button>
              <button
                type="button"
                className={editor?.isActive("heading", { level: 2 }) ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                className={editor?.isActive("heading", { level: 3 }) ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
              >
                H3
              </button>
              
              <div className="divider" />
              
              <button
                type="button"
                className={editor?.isActive("bulletList") ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                className={editor?.isActive("orderedList") ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                title="Numbered List"
              >
                1. List
              </button>
              <button
                type="button"
                className={editor?.isActive("blockquote") ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                title="Quote"
              >
                “ Quote
              </button>
              <button
                type="button"
                className={editor?.isActive("codeBlock") ? "is-active" : ""}
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                title="Code Block"
              >
                Code Block
              </button>
            </div>
          ) : (
            <p className="muted" style={{ padding: "8px 0" }}>
              {role === "COMMENT"
                ? "You have comment permissions on this page."
                : "You have read-only access to this page."}
            </p>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
      <aside>
        <CommentPanel pageId={pageId} canWrite={canComment(role)} />
        <HistoryPanel
          pageId={pageId}
          canSave={editable}
          ydoc={ydoc}
          previewHtml={editor?.getHTML() ?? ""}
        />
      </aside>
    </div>
  );
}
