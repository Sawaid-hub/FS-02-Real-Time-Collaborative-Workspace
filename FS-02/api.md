# HTTP and WebSocket API Reference

## Standard Error Response Format

All API errors return a standard JSON shape:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You lack permission to perform this action."
  }
}
```

- **401 UNAUTHENTICATED:** Session cookie or bearer credentials missing/expired.
- **403 FORBIDDEN:** Authenticated user lacks capability (e.g. `VIEW` role attempting write or non-owner updating roles).
- **404 NOT_FOUND:** Resource does not exist or user lacks membership (prevents existence leakage).
- **400 INVALID:** Request body failed Zod schema validation.

---

## 1. Authentication & Session

- `POST /api/register`
  - Body: `{ name: string, email: string, password: string (min 8) }`
- `POST /api/auth/signin`
  - Auth.js v5 credentials handler
- `GET /api/auth/session`
  - Current authenticated user session

---

## 2. Workspaces & Members

- `GET /api/workspaces`
  - Returns list of workspaces where the current user holds membership.
- `POST /api/workspaces`
  - Body: `{ name: string }`
  - Creator becomes owner with initial `EDIT` role.
- `GET /api/workspaces/:workspaceId`
  - Returns workspace metadata, pages, projects, tasks, and member list.
- `POST /api/workspaces/:workspaceId/members`
  - Body: `{ email: string, role: "VIEW" | "COMMENT" | "EDIT" }` (Owner only)
- `PATCH /api/workspaces/:workspaceId/members/:userId`
  - Body: `{ role: "VIEW" | "COMMENT" | "EDIT" }` (Owner only)
- `DELETE /api/workspaces/:workspaceId/members/:userId`
  - Removes member from workspace (Owner only)

---

## 3. Projects & Attached Files

- `GET /api/workspaces/:workspaceId/projects`
  - Lists all workspace projects with task counts and file attachments.
- `POST /api/workspaces/:workspaceId/projects`
  - Body: `{ name: string, description?: string, status?: ProjectStatus, color?: string, startDate?: string, targetDate?: string }`
- `GET /api/workspaces/:workspaceId/projects/:projectId`
  - Detailed project view with associated tasks and files.
- `PATCH /api/workspaces/:workspaceId/projects/:projectId`
  - Update status, name, color, or target completion date.
- `DELETE /api/workspaces/:workspaceId/projects/:projectId`
  - Delete project (Editors & Owner only).
- `POST /api/workspaces/:workspaceId/projects/:projectId/files`
  - Multipart form upload (`file` field). Saves file to `/public/uploads` and records metadata.
- `DELETE /api/workspaces/:workspaceId/projects/:projectId/files/:fileId`
  - Deletes physical file and database reference.

---

## 4. Tasks & Kanban Tracking

- `GET /api/workspaces/:workspaceId/tasks?projectId=&status=&priority=&assigneeId=`
  - Filterable tasks query for Kanban columns and table views.
- `POST /api/workspaces/:workspaceId/tasks`
  - Body: `{ title: string, description?: string, projectId?: string, status?: TaskStatus, priority?: TaskPriority, assigneeId?: string, dueDate?: string }`
- `PATCH /api/workspaces/:workspaceId/tasks/:taskId`
  - Update task status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`), priority, assignee, order, or details.
- `DELETE /api/workspaces/:workspaceId/tasks/:taskId`
  - Delete task (Editors & Owner only).

---

## 5. Collaborative Pages, Comments & Snapshots

- `POST /api/workspaces/:workspaceId/pages`
  - Body: `{ title: string }`
- `GET /api/pages/:pageId`
  - Page metadata and verification.
- `PATCH /api/pages/:pageId`
  - Body: `{ title: string }` (Editors only)
- `GET /api/pages/:pageId/comments`
  - Returns document inline comments with author details.
- `POST /api/pages/:pageId/comments`
  - Body: `{ body: string, anchorJson?: string }` (`COMMENT` or `EDIT` role)
- `GET /api/pages/:pageId/snapshots`
  - Version history snapshots.
- `POST /api/pages/:pageId/snapshots`
  - Body: `{ label: string, yDocBase64: string, previewHtml?: string }` (Editors only)

---

## 6. Real-Time WebSocket Collaboration

- `GET /api/collab-token?pageId=:pageId`
  - Returns `{ token, room, role }`. Token is a signed HS256 JWT containing verified user identity and role capabilities.
- `ws://localhost:1234/:room?token=:token`
  - Room pattern: `page:{pageId}`
  - Role capabilities on WebSocket:
    - `VIEW`: Receives document sync & live presence; inbound updates silently ignored.
    - `COMMENT`: Receives sync & presence; allowed to post comments via HTTP.
    - `EDIT`: Full bidirectional Yjs document updates and awareness cursor broadcasts.
  - Multi-instance testing: passing `?collabPort=1235` connects to secondary collab server instance with Redis Pub/Sub synchronization.
