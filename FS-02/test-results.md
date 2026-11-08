# FS-02 Test Results

## Automated checks — 8 Nov 2026

| Check | Command | Result |
| --- | --- | --- |
| Permission helpers | `npm test` | Passed: 1 file, 4 tests; 0 failures. Covers VIEW, COMMENT, and EDIT helper behavior. |
| TypeScript | `npx tsc --noEmit` | Passed: exit code 0, no diagnostics. |
| Production build | `npm run build` | Passed: Next.js 15.5.28 compiled and generated 11 static pages. |

## Fresh local collaboration check — 8 Nov 2026

- Used a disposable local PostgreSQL 16 and Redis 7 stack; the saved project database settings were not used for the demo.
- Created two synthetic accounts, a workspace and a shared page, then granted the second account EDIT access.
- Opened the same page in two browser sessions and entered a short edit from each session. Both edits appeared in both editors.
- After the UI fix, the presence bar showed `Collaborating (2)` with both collaborator initials.
- Visually checked the editor text after setting dark ink on the white page surface.

The two-browser check covers live editing and presence. It does not measure load, latency, or behavior after a full application/database restart.

## Earlier manual checks recorded on 22 Oct 2026

The project Memory records a local browser smoke test, role enforcement check, and a two-process Redis synchronization check using ports 1234 and 1235. Those historical checks were not repeated during this pass. No load or latency benchmark is recorded.

## Not checked in this pass

- Public Render deployment and production environment configuration.
- Redis multi-instance behavior under load, reconnects, or failure.
- Persistence after a full application and collaboration-server restart.
- Performance, concurrency capacity, or 99th-percentile latency.
- A screen recording saved into the submission package.

The results above show passing unit checks, typechecking, a production build, and a fresh local two-browser editing flow. They do not certify production-scale readiness.
