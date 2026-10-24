# FS-02: Real-Time Collaborative Workspace

A shared document workspace where multiple people edit the same page at once, see presence, comment by role, and keep concurrent edits through Yjs CRDTs.

Scope and acceptance criteria: [Overview.md](Overview.md). Coding and documentation standards: [RULES.md](RULES.md). Architecture: [docs/architecture.md](docs/architecture.md).

## Stack

Next.js (App Router), Auth.js credentials, PostgreSQL, Prisma, TipTap, Yjs, a separate WebSocket collab process, Redis for multi-instance fan-out.

## Setup

1. Install Node.js 20+ and Docker.
2. Copy environment placeholders:

```bash
cp .env.example .env
```

Set `AUTH_SECRET` to a long random string.

3. Start Postgres and Redis:

```bash
docker compose up -d
```

4. Install dependencies and migrate:

```bash
npm install
npx prisma migrate deploy
```

5. Run the app and the collab server (two terminals):

```bash
npm run dev
npm run dev:collab
```

Open http://localhost:3000, register two accounts, create a workspace, add the second user as a member, and open the same page in two browsers.

### Two collab instances (Redis test)

Keep Redis running, then:

```bash
npm run dev:collab
npm run dev:collab:b
```

Browser A: the normal page URL (port 1234). Browser B: add `?collabPort=1235` so that client talks to the second process. Edits should still converge through Redis.

## Scripts

- `npm run dev` — Next.js on port 3000
- `npm run dev:collab` — collab WebSocket on 1234
- `npm run dev:collab:b` — second collab process on 1235
- `npm test` — permission helper tests
- `npx prisma migrate deploy` — apply SQL migrations

## Layout

```text
app/              Next.js routes and HTTP APIs
components/       Editor, presence, comments, workspace UI
lib/              Auth, database, roles, collab token/rooms
server/collab/    Authorized Yjs WebSocket server
prisma/           Schema and migrations
docs/             Architecture, API, data, tests
FS-02/            Portal submission copies
```

Keep secrets in `.env` only. `.env.example` has placeholders.

## Submission

See [FS-02/README.md](FS-02/README.md) for the portal pack: architecture, API, tests, presentation outline, and reflection. No dataset is required.
