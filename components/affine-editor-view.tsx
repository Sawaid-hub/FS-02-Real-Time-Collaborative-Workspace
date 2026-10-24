"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { EditorContent, useEditor } from "@tiptap/react";
import NextLink from "next/link";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import TiptapLink from "@tiptap/extension-link";
import { canComment, canEdit, type Role } from "@/lib/roles";
import { roomNameForPage } from "@/lib/collab/rooms";
import { colorForUser, initials } from "@/lib/user-color";
import { CommentPanel } from "@/components/comment-panel";
import { HistoryPanel } from "@/components/history-panel";
import { AffineHeader } from "@/components/affine-header";
import { AffineSidebar, type SidebarDocItem } from "@/components/affine-sidebar";

type PresenceUser = { id: string; name: string; color: string };

interface AffineEditorViewProps {
  pageId: string;
  title: string;
  workspaceId: string;
  workspaceName: string;
  role: Role;
  userId: string;
  userName: string;
  token: string;
  allPages: SidebarDocItem[];
  isOwner?: boolean;
}

export function AffineEditorView({
  pageId,
  title,
  workspaceId,
  workspaceName,
  role,
  userId,
  userName,
  token,
  allPages,
  isOwner = false,
}: AffineEditorViewProps) {
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

  // Layout states
  const [mode, setMode] = useState<"page" | "edgeless">("page");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeRightDrawer, setActiveRightDrawer] = useState<"comments" | "history" | null>(null);
  const [docIcon, setDocIcon] = useState("📄");
  const [currentTitle, setCurrentTitle] = useState(title);

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
        TiptapLink.configure({ openOnClick: false }),
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

  async function handleRename(nextTitle: string) {
    if (!nextTitle.trim() || nextTitle === title) return;
    setCurrentTitle(nextTitle);
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: nextTitle.trim() }),
    });
  }

  const [coverGradient, setCoverGradient] = useState(
    "linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #fbcfe8 100%)"
  );
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);

  const coverPresets = [
    { name: "Sunset", bg: "linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #fbcfe8 100%)" },
    { name: "Aurora", bg: "linear-gradient(135deg, #a7f3d0 0%, #bae6fd 50%, #c7d2fe 100%)" },
    { name: "Ocean", bg: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)" },
    { name: "Twilight", bg: "linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #831843 100%)" },
    { name: "Emerald", bg: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)" },
    { name: "Warm Amber", bg: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #fde68a 100%)" },
  ];

  const emojiPalette = [
    "📄", "🚀", "💡", "📝", "📊", "🎯", "⚡", "🌟", "📚", "🎨",
    "🛠️", "💻", "🧠", "🔍", "📈", "🔥", "✨", "💎", "📦", "✅"
  ];

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function htmlToMarkdown(html: string, title: string, icon: string): string {
    const header = `# ${icon} ${title}\n\n`;
    const clean = html
      .replace(/<h1>(.*?)<\/h1>/gi, "\n# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/gi, "\n## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/gi, "\n### $1\n\n")
      .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i>(.*?)<\/i>/gi, "*$1*")
      .replace(/<code>(.*?)<\/code>/gi, "`$1`")
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n\n")
      .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<ul>([\s\S]*?)<\/ul>/gi, "$1\n")
      .replace(/<ol>([\s\S]*?)<\/ol>/gi, "$1\n")
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");

    return header + clean.trim() + "\n";
  }

  function handleExport(format: "md" | "html" | "json") {
    if (!editor) return;
    const sanitizedTitle = (currentTitle || "document").replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "html") {
      const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${currentTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { font-size: 2.2rem; margin-bottom: 0.5rem; }
    pre { background: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; }
    code { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${docIcon} ${currentTitle}</h1>
  ${editor.getHTML()}
</body>
</html>`;
      downloadFile(htmlDoc, `${sanitizedTitle}.html`, "text/html");
    } else if (format === "json") {
      const jsonStr = JSON.stringify(editor.getJSON(), null, 2);
      downloadFile(jsonStr, `${sanitizedTitle}.json`, "application/json");
    } else if (format === "md") {
      const markdown = htmlToMarkdown(editor.getHTML(), currentTitle, docIcon);
      downloadFile(markdown, `${sanitizedTitle}.md`, "text/markdown");
    }
  }

  return (
    <div className="affine-shell">
      {/* Left Navigation Sidebar */}
      <AffineSidebar
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        role={role}
        isOwner={isOwner}
        activeNav="docs"
        onSelectNav={() => {
          window.location.href = `/w/${workspaceId}`;
        }}
        docs={allPages}
        docsCount={allPages.length}
        projectsCount={0}
        tasksCount={0}
        membersCount={0}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(true)}
        userName={userName}
      />

      {/* Main Workspace Frame */}
      <main className="affine-main">
        {/* AFFiNE Header Bar */}
        <AffineHeader
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          title={currentTitle}
          role={role}
          mode={mode}
          onModeChange={setMode}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(false)}
          showModeSwitcher={true}
          onExport={handleExport}
          isCommentsOpen={activeRightDrawer === "comments"}
          onToggleComments={() =>
            setActiveRightDrawer(activeRightDrawer === "comments" ? null : "comments")
          }
          isHistoryOpen={activeRightDrawer === "history"}
          onToggleHistory={() =>
            setActiveRightDrawer(activeRightDrawer === "history" ? null : "history")
          }
        />

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Main Document / Edgeless Canvas View */}
          <div className="affine-scroll-area">
            {mode === "page" ? (
              /* Linear Page Mode */
              <div className="affine-doc-container">
                {/* Subtle Gradient Cover Banner */}
                <div
                  className="affine-doc-banner"
                  style={{ background: coverGradient }}
                >
                  {editable ? (
                    <div style={{ position: "absolute", top: 12, right: 16 }}>
                      <button
                        type="button"
                        onClick={() => setIsCoverPickerOpen(!isCoverPickerOpen)}
                        style={{
                          background: "rgba(255, 255, 255, 0.8)",
                          backdropFilter: "blur(4px)",
                          border: "1px solid rgba(0, 0, 0, 0.08)",
                          borderRadius: "var(--radius-md)",
                          padding: "4px 10px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "var(--affine-ink)",
                        }}
                      >
                        🎨 Change Cover
                      </button>

                      {isCoverPickerOpen ? (
                        <div
                          style={{
                            position: "absolute",
                            top: 36,
                            right: 0,
                            background: "var(--affine-card-bg)",
                            border: "1px solid var(--affine-border)",
                            borderRadius: "var(--radius-lg)",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                            padding: 12,
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 8,
                            width: 240,
                            zIndex: 100,
                          }}
                        >
                          {coverPresets.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setCoverGradient(preset.bg);
                                setIsCoverPickerOpen(false);
                              }}
                              style={{
                                height: 40,
                                background: preset.bg,
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--affine-border)",
                                cursor: "pointer",
                              }}
                              title={preset.name}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Document Emoji Icon Picker */}
                <div style={{ position: "relative", width: "fit-content" }}>
                  <div
                    className="affine-doc-icon-wrap"
                    onClick={() => {
                      if (editable) setIsEmojiPickerOpen(!isEmojiPickerOpen);
                    }}
                    title={editable ? "Click to change icon" : "Document icon"}
                  >
                    {docIcon}
                  </div>

                  {isEmojiPickerOpen ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 72,
                        left: 20,
                        background: "var(--affine-card-bg)",
                        border: "1px solid var(--affine-border)",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.15)",
                        padding: 12,
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: 8,
                        zIndex: 100,
                        width: 210,
                      }}
                    >
                      {emojiPalette.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => {
                            setDocIcon(em);
                            setIsEmojiPickerOpen(false);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.4rem",
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: 6,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "var(--affine-sidebar-hover)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Document Title */}
                <input
                  className="affine-doc-title-input"
                  defaultValue={title}
                  disabled={!editable}
                  placeholder="Untitled document"
                  onBlur={(e) => void handleRename(e.target.value)}
                />

                {/* Metadata & Real-time Presence Bar */}
                <div className="affine-doc-meta-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className={`status-dot ${status}`} />
                    <span>{status === "connected" ? "Live Yjs CRDT Sync" : status}</span>
                  </div>

                  <span>•</span>

                  {/* Active Collaborators Presence Avatars */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.78rem" }}>
                      {people.length > 0 ? `Collaborating (${people.length}):` : "Waiting for collaborators"}
                    </span>
                    {people.map((person) => (
                      <span
                        key={person.id}
                        className="avatar"
                        style={{
                          background: person.color,
                          width: 22,
                          height: 22,
                          fontSize: "0.68rem",
                        }}
                        title={`${person.name} (${person.id === userId ? "You" : "Collaborator"})`}
                      >
                        {initials(person.name)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* TipTap Toolbar & Rich Text Editor */}
                <div className="editor-frame" style={{ border: "none", boxShadow: "none", padding: 0 }}>
                  {editable ? (
                    <div className="toolbar" style={{ marginBottom: 20 }}>
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
                        : "👁️ You have read-only access to this page."}
                    </p>
                  )}

                  <EditorContent editor={editor} />
                </div>
              </div>
            ) : (
              /* Edgeless Whiteboard Canvas Mode */
              <div className="affine-edgeless-grid">
                <div className="affine-canvas-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.5rem" }}>{docIcon}</span>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{currentTitle}</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--affine-ink-secondary)", lineHeight: 1.5 }}>
                    Document Canvas Card linked to live real-time CRDT document. Switch back to Page mode to edit full content.
                  </p>
                  <div style={{ fontSize: "0.78rem", color: "var(--affine-muted)", marginTop: "auto" }}>
                    Status: {status} • Role: {role}
                  </div>
                </div>

                <div className="affine-canvas-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.5rem" }}>📋</span>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Tasks Integration</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--affine-ink-secondary)", lineHeight: 1.5 }}>
                    Connected to Workspace Task Board. Track action items and deliverables in sync with your document notes.
                  </p>
                  <NextLink
                    href={`/w/${workspaceId}`}
                    style={{ fontSize: "0.82rem", color: "var(--affine-primary)", fontWeight: 600 }}
                  >
                    View Task Board →
                  </NextLink>
                </div>

                <div className="affine-canvas-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--affine-primary-subtle)", color: "var(--affine-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Live Presence</h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--affine-ink-secondary)", lineHeight: 1.5 }}>
                    {people.length > 0
                      ? `${people.length} active collaborator(s) in this room.`
                      : "No other active collaborators currently."}
                  </p>
                  <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                    {people.map((p) => (
                      <span
                        key={p.id}
                        className="avatar"
                        style={{ background: p.color, width: 26, height: 26, fontSize: "0.75rem" }}
                      >
                        {initials(p.name)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Right Slide-Over Panel */}
          {activeRightDrawer && (
            <aside className="affine-right-drawer">
              <div className="affine-right-drawer-header">
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  {activeRightDrawer === "comments" ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Document Comments
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Version History
                    </>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveRightDrawer(null)}
                  style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: 16 }}>
                {activeRightDrawer === "comments" && (
                  <CommentPanel pageId={pageId} canWrite={canComment(role)} />
                )}

                {activeRightDrawer === "history" && (
                  <HistoryPanel
                    pageId={pageId}
                    canSave={editable}
                    ydoc={ydoc}
                    previewHtml={editor?.getHTML() ?? ""}
                  />
                )}
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
