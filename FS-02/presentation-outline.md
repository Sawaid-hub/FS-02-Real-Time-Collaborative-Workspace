# FS-02 Presentation Outline

**Duration:** 10 minutes, plus questions

**Presenter:** Individual presenter

| Time | Slide | Main points and demo cues |
| --- | --- | --- |
| 0:00–0:45 | Shared editing problem | Explain lost updates and why a shared document needs concurrent editing. State the goal: a small workspace with permissions and history. |
| 0:45–2:00 | System design | Next.js and Auth.js for the app; Prisma/PostgreSQL for durable records; TipTap and Yjs for shared text; separate WebSocket service; Redis pub/sub for multiple collab processes. |
| 2:00–3:15 | Authorization and persistence | Show workspace membership roles. Explain that HTTP routes check membership and the WebSocket token authorizes access to `page:{pageId}`. Yjs document updates persist in PostgreSQL; awareness is transient. |
| 3:15–6:00 | Two-browser demo | Sign in as two users, open one page, type from both sessions, and show live updates/presence. Change the second user's role to COMMENT or VIEW and show the allowed/blocked actions. |
| 6:00–7:15 | Workspace tools | Show comments and snapshots, then briefly show project/task views and file attachments if the demo data is ready. Keep the core collaborative page as the main path. |
| 7:15–8:30 | Evidence | Report the 4/4 permission tests, clean TypeScript check, and successful production build. Mention the recorded 22 October manual checks as historical evidence, not a fresh run. |
| 8:30–10:00 | Limits and next steps | State that there is no measured load/latency result and no deployment was verified in this pass. Next: capture a fresh multi-user recording, test reconnects and persistence, and measure a defined load. |

## Demo setup

Use a disposable local database, two test accounts, and two separate browser sessions. Do not use real user documents. Follow [demo-runbook.md](demo-runbook.md).
