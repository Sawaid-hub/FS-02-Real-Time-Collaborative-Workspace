# FS-02 Submission Pack

The application source is at the repository root. This folder holds the project-specific reviewer pack.

## Included

- [Architecture](architecture.md) — system diagram, synchronization and persistence boundaries
- [API reference](api.md) — HTTP and WebSocket contracts
- [Data model](data-model.md) — Prisma entities and relationships
- [Test results](test-results.md) — dated automated and historical manual evidence, with limits
- [Presentation outline](presentation-outline.md) — 10-minute talk plan
- [Demo runbook](demo-runbook.md) — local two-browser walkthrough
- [Individual reflection draft](reflection.md) — review for personal accuracy before submission

## Run the demo

Follow the repository [README](../README.md): start PostgreSQL and Redis, run Prisma migrations, start Next.js and the collaboration server, then create two accounts. Open the same page in two browser sessions to demonstrate synchronization and presence.

The Render Blueprint is deployment configuration, not proof of a live deployment. If no public deployment is available, record the local demo and include that video in the master Drive folder.

No dataset is required. Optional text fixtures can be used for a clearly labelled load check.
