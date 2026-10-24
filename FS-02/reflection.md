# Individual Reflection & Engineering Learnings

**Project:** FS-02 Real-Time Collaborative Workspace (Notion/AFFiNE Style)  
**Track:** Full-Stack Development Capstone  

---

## 1. Project Ownership & Contributions

Throughout the development of FS-02, I was responsible for engineering the complete full-stack architecture, spanning:
1. **Security & Data Layer:** Auth.js credentials authentication, Prisma ORM schema modeling (Workspaces, Memberships, Pages, Projects, Tasks, Files, Comments, Snapshots), and automated migrations in PostgreSQL 16.
2. **Real-Time CRDT Collab Engine:** Separate Node.js WebSocket service implementing the `y-websocket` protocol, custom JWT room verification, binary Yjs state debouncing, and Redis 7 multi-instance pub/sub fan-out.
3. **Role Authorization Engine:** Dual-pathway capability enforcement (`VIEW`, `COMMENT`, `EDIT`) across both Next.js App Router HTTP routes and low-level WebSocket connection hooks.
4. **Interactive AFFiNE & Notion UI Experience:** Full-height application frame with collapsible sidebar, Page Mode vs Edgeless Mode switcher, Kanban task management with inline quick-add, project progress tracking, multipart file upload, and document export (Markdown, HTML, JSON).

---

## 2. Core Technical Learnings

### A. CRDTs vs. Traditional REST Persistence
Prior to this project, state persistence was primarily conceptualized as RESTful `PUT`/`PATCH` updates with database locks or last-write-wins timestamps. Working with Yjs revealed that real-time text collaboration requires treating the document as an immutable history of commutative operations. Trying to save raw HTML strings breaks concurrent collaboration; saving debounced `Y.encodeStateAsUpdate` binary blobs maintains convergence across all clients without data corruption.

### B. Dual-Pathway Security Authorization
A common security vulnerability in collaborative applications is securing HTTP API routes while leaving WebSockets open to room guessing. In this project, we enforced strict authorization on both pathways:
- HTTP endpoints verify sessions and workspace membership before granting access.
- Low-level WebSocket connections cannot connect via room guessing alone; they must present a cryptographically signed HS256 JWT containing verified user identity and role capabilities (`VIEW`, `COMMENT`, `EDIT`).

### C. Architectural Boundary Discipline
Following `RULES.md` Rule 2 (keeping auth, persistence, transport, permissions, and UI strictly modular) prevented coupling headaches. Because the collaboration server was isolated from Next.js server actions, scaling it independently across ports `:1234` and `:1235` using Redis Pub/Sub was clean and straightforward.

---

## 3. What I Would Do Differently / Next Steps

1. **Active Live Room Snapshot Restore:** Currently, version history snapshots are inspect-only. In a production environment, restoring an old snapshot into an active Yjs room requires broadcasting a coordinated differential update to all connected clients rather than wiping the room.
2. **ProseMirror Inline Comment Highlights:** While comments currently support text body and metadata, binding comment threads directly to dynamic ProseMirror document nodes would provide visual inline highlights as text moves.
3. **Automated Stress & Latency Benchmarks:** Running automated load scripts with 50+ concurrent virtual clients editing simultaneously across multiple Redis nodes to measure 99th-percentile sync latency.
