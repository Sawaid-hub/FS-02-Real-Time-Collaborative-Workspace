# Individual Reflection Draft — FS-02

**Review this draft before submission and adjust any detail that does not match your experience.**

Working on the collaborative workspace helped me understand that live editing needs more than a text editor and a save button. Yjs keeps concurrent changes mergeable, while the WebSocket service carries updates and presence between browsers. PostgreSQL remains the durable store, and Redis is used to pass collaboration messages between server instances.

One important lesson was that permissions have to be enforced in both places where a user can reach a document: normal HTTP routes and the WebSocket room. Securing only the page UI would leave another path open. I also learned to describe test evidence carefully: a passing permission helper suite and successful build are useful, but they do not replace a current two-browser recording or a measured load test.

My contribution to this project was bringing the main workspace pieces together: authentication, workspace membership and roles, collaborative pages, comments and snapshots, plus the project and task views. The hardest part was keeping the editor, persistence, and access checks aligned while the UI grew.

If I continued the project, I would add repeatable automated tests for concurrent edits and reconnects, then capture measurements under a stated number of users and server instances. I would also make snapshot restoration available to active collaborators only after its update and permission behavior had dedicated tests.
