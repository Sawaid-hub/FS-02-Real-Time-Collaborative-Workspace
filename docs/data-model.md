# Data model

Prisma models live in `prisma/schema.prisma`. PostgreSQL is the source of truth.

## Entities

- **User:** `id`, `email` (unique), `name`, `passwordHash`, `createdAt`.
- **Workspace:** `id`, `name`, `ownerId`, `createdAt`.
- **Membership:** `userId`, `workspaceId`, `role` (`VIEW` | `COMMENT` | `EDIT`), unique `(userId, workspaceId)`.
- **Page:** `id`, `workspaceId`, `title`, `yDoc` (bytes, Yjs update), `updatedAt`.
- **Comment:** `id`, `pageId`, `authorId`, `body`, `anchorJson`, `createdAt`.
- **Snapshot:** `id`, `pageId`, `authorId`, `label`, `yDoc` (bytes), `previewHtml`, `createdAt`.

## Indexes

Foreign-key lookups: `Membership.userId`, `Membership.workspaceId`, `Page.workspaceId`, `Comment.pageId`, `Snapshot.pageId`. Unique email. Unique membership pair.

## Room mapping

`page.pageId` → room `page:{pageId}`.
