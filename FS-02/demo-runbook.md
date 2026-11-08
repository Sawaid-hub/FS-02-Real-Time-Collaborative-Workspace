# FS-02 Demo Runbook

## Local flow verified on 8 Nov 2026

A disposable local PostgreSQL and Redis stack was used with two synthetic accounts. The second account received EDIT access to the workspace. Both browser sessions opened the same page, and edits from either browser appeared in the other. The presence bar showed two collaborators after the awareness identity fix. The editor text is now dark on its white page surface.

## Before recording

1. Start disposable PostgreSQL and Redis services. Keep the project's saved database settings and real user data out of the demo.
2. Apply Prisma migrations and start Next.js (`:3000`) and the collaboration server (`:1234`).
3. Register two synthetic accounts, create a workspace and page, and add the second account as a member.
4. Open separate browser profiles and sign in as the two accounts.

## Three-minute core demo

1. Open the same page in both browsers and confirm the presence bar shows `Collaborating (2)`.
2. Type a short sentence from each browser and show both edits in both sessions.
3. Change the member role to COMMENT; show that editing is disabled and commenting remains available.
4. Change the member role to VIEW; show read-only access.
5. Open comments or the snapshot panel. If demonstrating persistence, reload after confirming edits have been saved.

## Optional segment

Show a project/task view or attachment only if test data is available. Keep it optional so the core collaboration workflow stays within time.

## Evidence capture

Save screenshots or a short recording under the local submission package's `FS-02/evidence/` folder. Capture the two-browser edit and presence state, the permission change, and a reload if persistence is demonstrated. Uploading or submitting the package remains a separate step.
