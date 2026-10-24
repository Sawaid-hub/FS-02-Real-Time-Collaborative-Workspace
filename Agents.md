# Agent and Contributor Instructions

## Memory.md (always)

- Read [Memory.md](Memory.md) at the start of every session, before other project files.
- Before the first command, append any missing prior work to the progress log.
- After every completed command or task, append a dated bullet (what ran, what changed, what broke, what is next).
- Do not start the next task until Memory.md is current. No secrets or private document text.

## Before changing code

- Read [Memory.md](Memory.md), [RULES.md](RULES.md), [README.md](README.md), and [Overview.md](Overview.md).
- Inspect the existing repository and preserve its conventions; do not replace an existing architecture without a clear reason.
- Keep the MVP tied to the acceptance criteria in `Overview.md` and the standards in `RULES.md`.

## Implementation

Follow `RULES.md` in full. The short list:

- Use Yjs shared state for concurrent editing; do not implement collaboration as last-write-wins HTTP saves.
- Define persistence/reconnect behavior and document snapshots explicitly.
- Enforce membership and view/comment/edit permissions in server routes and when authorizing WebSocket room access.
- Keep authentication, persistence, collaboration transport, and editor UI separated.
- Never commit secrets, tokens, or private user content. Keep local values in environment variables and commit only placeholders in `.env.example`.
- Make small, focused changes and keep commits understandable.
- Update setup/API/data documentation when behavior or contracts change.

## Documentation

- `README.md` is setup and run instructions.
- `Overview.md` is scope and acceptance criteria.
- `RULES.md` is coding, docs, architecture, security, and verification standards.
- `docs/` holds architecture, API, data, room naming, and test evidence once those exist.
- Write for a reviewer who has not seen the repo. Keep docs current; record decisions in `Memory.md`.

## Verification

Test at least two browser sessions editing the same document, reload persistence, reconnect behavior, role restrictions, comment/history flows, and Redis/multi-instance behavior. Label mocks and limitations accurately; do not claim convergence or scale without observing it.

## Collaboration

Before parallel work, agree on file ownership, document model, Yjs provider/room contract, persistence strategy, and permissions. Avoid multiple contributors editing the same files at once. Record non-obvious decisions and unresolved questions in `Memory.md`.
