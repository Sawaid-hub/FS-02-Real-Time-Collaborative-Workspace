# Project Overview: Real-Time Collaborative Workspace

## Purpose

Build a small collaborative workspace inspired by Notion/Figma. Users create or join workspaces, edit shared pages together, see who is online, and use permissions and history to understand and control changes.

## Goals

1. Demonstrate concurrent editing with Yjs CRDT shared state.
2. Persist users, workspaces, pages, and permissions in PostgreSQL through Prisma.
3. Synchronize edits and presence through WebSockets.
4. Provide comments, version-history snapshots, and view/comment/edit roles.
5. Exercise synchronization with multiple browser sessions and document results.

## Scope

### Required features

- Login/authentication
- Workspaces and pages, stored in PostgreSQL using Prisma
- Rich-text editing using TipTap or ProseMirror connected to Yjs
- WebSocket synchronization using `y-websocket` or a documented compatible server
- Live presence with avatars and colored cursors
- Comments
- Version-history snapshots
- View, comment, and edit permissions
- Redis for coordination/scaling across multiple server instances, with a multi-instance test

### Out of scope for the capstone

- Full parity with Notion or Figma
- Complex enterprise administration, billing, or offline-first sync guarantees beyond the selected Yjs setup
- Production scale claims without measurements

## Proposed architecture

Next.js provides the application UI and server endpoints. Prisma connects application records to PostgreSQL. A Yjs-enabled editor maintains shared document state, with WebSockets carrying collaboration updates and presence. Redis supports coordination when more than one collaboration server instance is running. Persist document snapshots and workspace metadata with explicit authorization checks.

Treat document persistence and the authorization of WebSocket connections as first-class requirements: a protected page must not become editable merely because a client can connect to its room.

## Core data concepts

- User
- Workspace and membership
- Page/document metadata
- Permission or membership role (view, comment, edit)
- Comment and anchored location/reference
- Version snapshot (author, timestamp, content/update reference)

Document final fields, indexes, snapshot format, room naming, access checks, and API contracts before implementation is considered complete. Implementation and documentation standards live in [RULES.md](RULES.md).

## Delivery plan

1. **Learn and design:** Read Yjs CRDT basics; diagram the app, database, WebSocket flow, and permissions.
2. **Foundation:** Scaffold Next.js, PostgreSQL, and Prisma; implement login, workspace, membership, and page creation.
3. **Single-user editor:** Add TipTap or ProseMirror and persist/reopen documents.
4. **Live collaboration:** Connect Yjs and a WebSocket server; verify concurrent edits converge across multiple browsers.
5. **Presence and collaboration tools:** Add avatars/cursors, comments, and version snapshots.
6. **Security and scaling:** Implement view/comment/edit permissions for both HTTP and WebSocket paths; add Redis and test multiple server instances.
7. **Quality and release:** Test concurrent edits, reconnects, persistence, permissions, comments/history; deploy or record the demo and capture evidence.
8. **Submission:** Finalize documentation, results, presentation, and individual reflection.

## Acceptance criteria

- A user can sign in, create a workspace/page, and reopen saved content.
- Two or more browser sessions can edit the same document concurrently and converge without lost changes.
- Online users and cursors/avatars appear during a collaboration session.
- Viewers cannot edit; commenters can comment but cannot edit; editors can modify content.
- Access rules apply to WebSocket rooms as well as normal application routes.
- Comments and version snapshots can be created and inspected.
- The project demonstrates Redis-backed multi-instance coordination or clearly documents a tested limitation.
- README setup instructions, architecture/API documentation, and demo evidence are sufficient for another developer/reviewer to follow.

## Risks and scope control

Real-time state, persistence, permissions, and scaling are the most technically sensitive parts. Prove two-browser convergence and reload persistence before polishing the interface. Keep the first release to text pages and basic comments; avoid adding arbitrary canvas features. Document what the Redis/multi-instance test actually demonstrates rather than claiming production scalability. Contributors must follow [RULES.md](RULES.md) so coding, docs, and tests stay aligned with this scope.

## Portal deliverables

Put code, reports, screenshots, and any sample data in the `FS-02` submission subfolder. Include the shared deliverables listed in the portal: working demo/recording, repository and setup guide, architecture and API/data docs, test results, 10-minute presentation, and individual reflection.
