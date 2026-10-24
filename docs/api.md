# HTTP and WebSocket API

Error shape: `{ "error": { "code": "FORBIDDEN", "message": "..." } }`.

Hidden resources return **404** rather than 403 so membership is not leaked. Unauthenticated requests return **401**. Authenticated users who can see the resource but lack a capability (for example a viewer posting a comment) receive **403**.

## Auth

- `POST /api/register` `{ name, email, password }`
- `POST /api/auth/signin` Auth.js credentials (used by the login page)
- `GET /api/auth/session`

## Workspaces

- `GET /api/workspaces` list memberships for the current user
- `POST /api/workspaces` `{ name }` creator becomes owner with `EDIT`
- `GET /api/workspaces/:workspaceId` pages + members
- `POST /api/workspaces/:workspaceId/pages` `{ title }` editors only
- `POST /api/workspaces/:workspaceId/members` `{ email, role }` owner only
- `PATCH /api/workspaces/:workspaceId/members/:userId` `{ role }` owner only
- `DELETE /api/workspaces/:workspaceId/members/:userId` owner only

## Pages

- `GET /api/pages/:pageId`
- `PATCH /api/pages/:pageId` `{ title }` editors only
- `GET /api/pages/:pageId/comments`
- `POST /api/pages/:pageId/comments` `{ body, anchor? }` comment or edit
- `GET /api/pages/:pageId/snapshots`
- `POST /api/pages/:pageId/snapshots` `{ label, yDocBase64, previewHtml? }` editors only

## Collaboration

- `GET /api/collab-token?pageId=` returns `{ token, room, role }`
- WebSocket: `{COLLAB_URL}/{room}?token=` where `room` is `page:{pageId}`
- Query `?collabPort=1235` on the page editor points a browser at a second collab instance

## Roles

`VIEW` receive Yjs updates, no comments, no edits. `COMMENT` receive updates, may comment. `EDIT` send and receive Yjs updates, comments, snapshots, page create/rename.
