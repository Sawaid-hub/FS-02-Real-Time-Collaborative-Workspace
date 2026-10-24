# 10-Minute Capstone Presentation Outline

**Project:** FS-02 Real-Time Collaborative Workspace (Notion/AFFiNE Style)  
**Presenter:** Antigravity Full-Stack Capstone Team  
**Duration:** 10 Minutes + Q&A  

---

## 1. Problem Statement & Motivation (1.5 Minutes)
- **The Challenge:** Traditional document collaboration often suffers from last-write-wins collisions, cumbersome file locking, and disconnected task management.
- **The Goal:** Build an integrated collaborative workspace inspired by AFFiNE and Notion that seamlessly combines:
  - Conflict-Free Replicated Data Types (CRDTs) for concurrent rich text editing.
  - Interactive project lifecycle tracking with Kanban boards and file attachments.
  - Granular role-based access control (`VIEW`, `COMMENT`, `EDIT`) enforced on both HTTP and WebSocket layers.
  - A responsive, aesthetic UI with instant dark mode and Page vs Edgeless mode switching.

---

## 2. Live System Demonstration (4.5 Minutes)
- **Part A: Workspace & Navigation (1 min):**
  - Walk through the AFFiNE-inspired collapsible sidebar and global Command Palette (`Ctrl+K`).
  - Demonstrate instant switching between All Documents, Projects, Tasks, and Team Members.
- **Part B: Multi-User Concurrency & Roles (2 mins):**
  - Side-by-side browser demo: Alice (Owner) and Bob (Editor) typing simultaneously into the same document with live cursor presence and color awareness.
  - Demonstrate role downgrade to `COMMENT`: Bob's editor becomes read-only; editing is locked, but comment submission in the slide-over drawer remains active.
  - Demonstrate role downgrade to `VIEW`: Commenting is blocked; live sync updates are still received in real-time.
- **Part C: Projects, Tasks & Export (1.5 mins):**
  - Interactive Kanban board: inline quick-add, status dragging, priority badges, and progress bar calculations.
  - Project file attachments: upload and download.
  - Document export: 1-click export to Markdown (`.md`), HTML, and JSON snapshot.

---

## 3. System Architecture & High-Performance Scaling (2 Minutes)
- **Multi-Process Architecture:** Next.js 15 App Router (`:3000`), Node.js `y-websocket` server (`:1234`), PostgreSQL 16 DB (`:5432`), and Redis 7 Pub/Sub (`:6379`).
- **Distributed Scaling:** How Redis Pub/Sub fans out Yjs updates across independent WebSocket server instances (`:1234` and `:1235`), verified with zero message loss.
- **Data Persistence Strategy:** Debounced binary persistence of `Y.encodeStateAsUpdate` into PostgreSQL `BYTEA` columns, eliminating database bottlenecks.

---

## 4. Key Engineering Challenges & Solutions (1.5 Minutes)
- **Challenge 1: Dual-Pathway Authorization:** Preventing room guessing on raw WebSockets by implementing signed HS256 JWT tokens minted via authenticated HTTP endpoints.
- **Challenge 2: AFFiNE UI vs Collaborative Canvas:** Preserving robust CRDT text persistence in Page Mode while introducing an interactive Edgeless visual card grid without breaking Yjs state.
- **Challenge 3: Slide-Over Drawers vs Canvas Space:** Eliminating static side panel clutter by building a 360px animated drawer for comments and version history.

---

## 5. Reflection & Future Roadmap (0.5 Minutes)
- **Key Takeaways:** CRDT mechanics, WebSocket security, debounced binary storage, and modern design systems.
- **Next Horizons:** Inline TipTap text highlight anchoring for comments, gated snapshot restore into active Yjs rooms, and distributed WebRTC P2P fallback.
