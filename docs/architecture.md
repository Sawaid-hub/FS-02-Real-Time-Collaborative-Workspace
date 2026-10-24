# Architecture

FS-02 is a Notion-style collaborative text workspace. Next.js serves the UI and HTTP APIs. PostgreSQL (Prisma) stores users, workspaces, memberships, pages, Yjs document bytes, comments, and snapshots. A separate Node WebSocket process synchronizes Yjs updates and awareness. Redis pub/sub coordinates more than one collab process.

## Processes

- **Next.js** (`:3000`): auth, workspace/page UI, REST APIs, collab-token minting.
- **Collab server** (`:1234`, optional second `:1235`): Yjs WebSocket rooms, Postgres persistence, Redis fan-out.
- **PostgreSQL** (`:5432`): source of truth.
- **Redis** (`:6379`): collab coordination only. Not used for permissions or document source of truth.

## Collaboration contract

- Room name: `page:{pageId}` from `roomNameForPage` in `lib/collab/rooms.ts`.
- Client: `y-websocket` `WebsocketProvider` at `{COLLAB_URL}/{room}?token=`.
- Token: HS256 JWT (`jose`) minted by `GET /api/collab-token?pageId=` after membership check. Claims: `sub` (userId), `pageId`, `role`, `name`.
- On first room load, the collab server applies `Page.yDoc` (`Y.applyUpdate`) if bytes exist.
- After document updates, the server debounces (~2s) and writes `Y.encodeStateAsUpdate` to `Page.yDoc`.
- Awareness (names, colors, cursors) is ephemeral and is not stored in PostgreSQL.
- Reconnect: the client provider reconnects; the server already has the room doc or reloads it from Postgres.
- Roles on the socket: `VIEW` and `COMMENT` may receive sync/awareness; incoming Yjs updates from those sockets are dropped. `EDIT` may send and receive.

## Permission flow

HTTP route handlers and the WebSocket upgrade both resolve membership via `lib/permissions`. A guessed room name does not grant access. Hidden resources use HTTP 404.

## Snapshot encoding

Snapshots store `Y.encodeStateAsUpdate` as `BYTEA` plus optional `previewHtml` for the history panel. Restore into a live room is out of MVP (inspect only).
