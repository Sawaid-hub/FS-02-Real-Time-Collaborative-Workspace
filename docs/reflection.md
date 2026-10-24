# Individual reflection

This capstone is a real-time collaborative workspace. Ownership in this repository covers project rules, the Auth.js + Prisma foundation, the TipTap/Yjs editor, the authorized collab server, comments and snapshots, and Redis multi-instance coordination.

What I learned: CRDT updates cannot be treated like REST document PUT; WebSocket rooms need the same membership checks as HTTP; persistence and awareness must be separated; Redis is a fan-out bus, not a source of truth.

What I would do next: snapshot restore with a gated Y.Doc replace, comment anchors in the ProseMirror document, and a small load test with recorded numbers.
