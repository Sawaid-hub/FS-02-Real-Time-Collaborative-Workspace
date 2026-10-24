# 10-minute presentation outline

1. Problem (1 min): concurrent editing without last-write-wins.
2. Demo (4 min): two browsers, presence, comment vs edit roles, snapshot inspect, reload.
3. Architecture (2 min): Next.js, Prisma/Postgres, collab WebSocket process, Redis pub/sub.
4. Hard parts (2 min): WS authorization, Yjs persistence, multi-instance Redis test.
5. Limits and learning (1 min): inspect-only snapshots, measured two-instance demo, not production scale.
