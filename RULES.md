# Project Rules

This file is the source of truth for coding, documentation, architecture, security, and verification. Cursor rules in `.cursor/rules/` summarize these standards for the agent. If a short rule and this file disagree, follow this file.

Read this file together with [README.md](README.md), [Overview.md](Overview.md), and [AGENTS.md](AGENTS.md) before changing code.

## 0. Memory.md session rule (always)

This rule is mandatory for every agent and contributor session.

- At the **start of every session**, read [Memory.md](Memory.md) before any other project file besides this list.
- **Before the first command** of a session, append anything already done that is missing from the progress log.
- **After every completed command or task**, append a dated bullet: what ran, what changed, what broke, and what is next.
- Do not start the next task until Memory.md is current.
- Never write secrets, tokens, passwords, or private document text into Memory.md.

## 1. Scope and product constraints

- Build the MVP in [Overview.md](Overview.md) only: auth, workspaces, pages, Yjs rich text, presence, comments, version snapshots, view/comment/edit roles, Redis multi-instance coordination.
- Keep the first release to text pages and basic comments. Do not add a Figma-style canvas, billing, enterprise admin, or offline-first guarantees beyond the chosen Yjs setup.
- Do not claim production scale, guaranteed convergence, or performance numbers unless they were measured and recorded.
- Label mocks, stubs, and known limitations in code comments and docs.

## 2. Architecture

Keep these layers separate. Do not mix them in one module.

| Layer | Responsibility | Typical location |
| --- | --- | --- |
| Authentication | Sessions, identity, login/logout | `lib/auth` |
| Persistence | Users, workspaces, pages, comments, snapshots | `lib/db`, `prisma/` |
| Collaboration transport | WebSocket rooms, Yjs updates, Redis pub/sub | `lib/collab` |
| Permissions | Membership and view/comment/edit checks | `lib/permissions` |
| Editor UI | TipTap/ProseMirror, presence, comments UI | `components/` |
| App routes | Next.js pages and HTTP handlers | `app/` |

- Use Yjs shared state for concurrent editing. Do not persist collaboration as last-write-wins HTTP saves of the full document.
- Authorize both HTTP routes and WebSocket room joins. A client that can guess a room name must not gain edit access.
- Define persistence, reconnect, snapshot format, and room naming in `docs/` before treating collaboration as done.
- Prefer a self-hosted `y-websocket` (or a documented compatible server) plus Redis when more than one instance is running.

## 3. Coding standards

### Language and stack

- TypeScript throughout application code. Avoid `any`; use `unknown` and narrow.
- Next.js App Router conventions. Server code stays on the server; client components are marked `'use client'` only when they need browser APIs, Yjs, or interactive UI.
- Prisma for all PostgreSQL access. Do not introduce a second ORM or raw SQL unless Prisma cannot express the query; if raw SQL is required, keep it in one data-access function and document why.
- Redis only for collaboration coordination/scaling, not as the source of truth for users, pages, or permissions.

### Naming

- Files: `kebab-case` for route folders and shared utilities; `PascalCase` for React components (`page-editor.tsx` is acceptable if it matches nearby files—stay consistent with the existing tree).
- React components: `PascalCase`. Hooks: `useSomething`. Types/interfaces: `PascalCase`. Booleans: `is`, `has`, `can`.
- Prisma models: `PascalCase` singular (`User`, `Workspace`, `Page`). Fields: `camelCase`.
- Yjs room names: document the exact pattern (for example `page:{pageId}`) in `docs/` and use one helper to build them.

### Functions and modules

- One export purpose per file when practical. Keep auth, Prisma, Yjs, and UI imports from crossing into the wrong layer.
- Prefer small, pure helpers for permission checks: `canView`, `canComment`, `canEdit`.
- Handle errors at boundaries (route handlers, WebSocket auth, UI loaders). Do not swallow errors with empty `catch` blocks.
- Do not log secrets, session tokens, raw document content, or private user text.

```ts
// ❌ BAD — last-write-wins document save
await prisma.page.update({
  where: { id: pageId },
  data: { contentHtml: editor.getHTML() },
});

// ✅ GOOD — persist Yjs updates / snapshots through the collab layer
await persistYjsUpdate({ pageId, update, userId });
```

```ts
// ❌ BAD — room join without membership
wsServer.on("connection", (ws, req) => joinRoom(req.query.room));

// ✅ GOOD — authorize role before attaching the Yjs provider
const access = await authorizePageRoom({ userId, pageId });
if (!access.canView) return rejectUnauthorized();
```

### React and editor UI

- Functional components only.
- Put collaboration wiring (Y.Doc, provider, awareness) in dedicated hooks or lib modules, not inside presentational components.
- Presence (avatars, cursor colors) must come from Yjs awareness, not from a separate ad-hoc poll unless documented as a fallback.
- Disable editing in the editor when the role is `view` or `comment`. Comment UI may be enabled for `comment` and `edit` only.
- Do not block the main thread with large snapshot diffs in the UI; load history on demand.

### Prisma and data

- Every model that the MVP needs should exist before features are considered complete: User, Workspace, Membership, Page, Comment, Snapshot (names may vary; the concepts must exist).
- Membership role is one of `view`, `comment`, `edit` (plus workspace owner if needed). Enforce the same enum in Prisma, API validation, and UI.
- Comments store author, page, timestamp, body, and an anchor/reference into the document.
- Snapshots store author, timestamp, and a content or Yjs update reference. Document the binary/encoding format.
- Use migrations for schema changes. Never edit applied migration history by hand.
- Add indexes for foreign keys and lookup paths used by room auth (`pageId`, `workspaceId`, `userId`).

### API and WebSocket contracts

- Validate input at the route boundary (IDs, role values, comment bodies).
- Return consistent JSON error shapes: `{ "error": { "code": "FORBIDDEN", "message": "..." } }`.
- HTTP 401 unauthenticated, 403 authenticated but not allowed, 404 for missing or hidden resources when that is safer than leaking existence—pick one 404 policy and document it.
- WebSocket auth must run before Yjs updates are applied. Map roles to capabilities: view = receive updates; comment = receive + comment APIs; edit = receive + send Yjs updates.

### Environment and secrets

- Local secrets live in `.env` (gitignored). Commit only `.env.example` with placeholders.
- Never commit tokens, database URLs with credentials, Redis passwords, or private user content.
- Name variables clearly: `DATABASE_URL`, `REDIS_URL`, `COLLAB_SERVER_URL`, auth secret names as required by the chosen auth approach.

### Git

- Small, focused commits. Message says why, not a file list.
- Do not commit `node_modules`, `.env`, editor dumps, or generated secrets.
- Do not rewrite public history.

## 4. Documentation writing

Write docs for another intern or reviewer who has never seen the repo.

### Voice and structure

- Short sentences. Active voice. State what the system does, then how to run it.
- Lead with the current truth. Do not leave stale “we will later” text after a feature ships—update or delete it.
- Prefer lists and tables for contracts, env vars, and commands. Use diagrams (Mermaid is fine) for WebSocket and permission flows.
- Define project terms on first use: workspace, page, role, room, snapshot, awareness.

### Which file holds what

| File | Contents |
| --- | --- |
| `README.md` | What the project is, stack, setup, scripts, env vars, how to run two clients |
| `Overview.md` | Purpose, scope, acceptance criteria, delivery plan |
| `RULES.md` | Coding, docs, architecture, security, and verification standards |
| `AGENTS.md` | Agent/contributor workflow; points here for standards |
| `Memory.md` | Decisions, open questions, progress log |
| `docs/` | Architecture, API, data model, room naming, snapshot format, test evidence |

### Required docs before a feature is “done”

- Setup: commands that actually work on a clean machine.
- Data: Prisma models, relations, indexes, snapshot encoding.
- API: routes, payloads, error codes, auth.
- Collaboration: room name pattern, reconnect behavior, what is persisted vs awareness-only.
- Permissions: how view/comment/edit is checked on HTTP and WebSocket.
- Redis: what is coordinated across instances and what the multi-instance test proved.
- Limitations: anything mocked or untested.

### Docs hygiene

- Update README/docs in the same change as a contract or setup change.
- Do not paste secrets or private document text into docs, screenshots, or `Memory.md`.
- Record non-obvious decisions in `Memory.md` (auth choice, Yjs server, snapshot format, Redis approach, hosting).
- Portal deliverables (demo, architecture, API/data docs, tests, presentation, reflection) go under the `FS-02` submission folder when packaging.

## 5. Verification

Do not mark collaboration or permissions complete from a single-browser smoke test.

Required evidence:

1. Sign in, create a workspace and page, reload, and see saved content.
2. Two or more browser sessions edit the same page; changes converge with no silent lost writes.
3. Disconnect and reconnect; the client resyncs without duplicating or wiping content.
4. Presence: avatars and cursors visible during a live session.
5. Roles: viewer cannot edit; commenter can comment only; editor can edit.
6. The same role rules apply when joining the WebSocket room.
7. Comments and snapshots can be created and inspected.
8. Redis/multi-instance: two server instances, or a documented, tested limitation.

Record what was run, what passed, and any numbers (latency, clients) in test docs. If a test was not run, say so.

## 6. Collaboration between contributors

- Before parallel work, agree on file ownership, document model, Yjs provider/room contract, persistence, and permissions.
- Do not have two people editing the same files at once.
- Keep MVP work sequenced: foundation (auth, workspace, page) → single-user editor persistence → live Yjs → presence/comments/snapshots → HTTP + WebSocket permissions → Redis multi-instance → demo and docs.

## 7. Checklist for every change

- [ ] Fits Overview acceptance criteria; no out-of-scope canvas/admin features.
- [ ] Layers stay separated (auth, db, collab transport, permissions, UI).
- [ ] Permissions enforced on the path you touched (HTTP and/or WebSocket).
- [ ] No secrets committed; `.env.example` updated if a new variable was added.
- [ ] Types are honest; no unexplained `any`.
- [ ] README or `docs/` updated if setup or contracts changed.
- [ ] Decision or limitation recorded in `Memory.md` when it is not obvious.
- [ ] Behavior verified at the level the change requires (see section 5).
