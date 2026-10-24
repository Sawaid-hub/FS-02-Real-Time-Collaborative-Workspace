# Deploying to Render.com

This guide provides step-by-step instructions for deploying both the **Frontend (Next.js)** and **Backend (WebSocket Collab Server + PostgreSQL)** of the Real-Time Collaborative Workspace on [Render.com](https://render.com).

---

## Architecture Overview

The system consists of three primary components on Render:

| Service | Type on Render | Description | Port / Protocol |
| :--- | :--- | :--- | :--- |
| **`fs02-workspace-web`** | Web Service (Node) | Next.js 15 App (UI, SSR, Auth, REST APIs) | HTTP / HTTPS (`PORT=3000`) |
| **`fs02-workspace-collab`** | Web Service (Node) | Real-Time Yjs CRDT & Presence sync server | WebSockets (`WSS` on `$PORT`) |
| **`fs02-postgres`** | PostgreSQL Database | Managed PostgreSQL 16 database | Port 5432 (Internal connection) |
| *(Optional)* **`fs02-redis`** | Redis (Render or Upstash) | Multi-instance pub/sub coordination | Optional (standalone mode default) |

---

## Option 1: Automated Deployment via Render Blueprint (Recommended)

The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint specification that automatically provisions the PostgreSQL database, the Next.js web application, and the real-time WebSocket collab server with environment variable linkages.

### Steps:

1. **Push your code to GitHub or GitLab**:
   Ensure your latest code (including `render.yaml`) is committed and pushed to your remote repository.

2. **Open Render Dashboard**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and log in.
   - Click the **New +** button in the top navigation bar and select **Blueprint**.

3. **Connect Repository**:
   - Select your Git provider (GitHub / GitLab) and select this repository (`FS-02-Real-Time-Collaborative-Workspace`).
   - Give your blueprint instance a name (e.g. `collab-workspace`).
   - Choose a region (e.g. `Oregon (US West)` or `Frankfurt (EU)`).

4. **Review & Apply**:
   - Render will display the resources detected from `render.yaml`:
     - `fs02-postgres` (PostgreSQL Database)
     - `fs02-workspace-web` (Web Service)
     - `fs02-workspace-collab` (Web Service)
   - Click **Apply**.

5. **Automatic Provisioning**:
   - Render will automatically provision the database and build both services.
   - Database migrations (`prisma migrate deploy`) run automatically during the build step.
   - Once deployment completes, your workspace will be live at `https://fs02-workspace-web.onrender.com`!

---

## Option 2: Manual Setup via Render Dashboard

If you prefer to configure the services manually in the Render dashboard:

### Step 1: Create the PostgreSQL Database

1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Settings:
   - **Name**: `fs02-postgres`
   - **Database**: `fs02`
   - **User**: `fs02_user`
   - **Region**: Choose closest to you (e.g., `Oregon`).
   - **Plan**: `Free`.
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (e.g. `postgres://fs02_user:...@dpg-...-a/fs02`).

---

### Step 2: Create the Collab WebSocket Web Service

1. Click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Name**: `fs02-workspace-collab`
   - **Region**: Same region as database (e.g. `Oregon`).
   - **Branch**: `main` (or your active branch).
   - **Runtime**: `Node`.
   - **Build Command**:
     ```bash
     npm install --include=dev && npx prisma generate
     ```
   - **Start Command**:
     ```bash
     npm run start:collab
     ```
   - **Plan**: `Free`.
4. Add **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | |
   | `DATABASE_URL` | Paste **Internal Database URL** from Step 1 | Connects to Postgres |
   | `AUTH_SECRET` | Generate random 32+ char string (e.g. `openssl rand -hex 32`) | Must match Web Service |
5. Health Check Path: `/` (returns HTTP 200 `fs02-collab`).
6. Click **Create Web Service**.
7. Note down the public URL assigned to this service (e.g. `https://fs02-workspace-collab.onrender.com`).
   Your WebSocket URL will be: `wss://fs02-workspace-collab.onrender.com`.

---

### Step 3: Create the Next.js Frontend Web Service

1. Click **New +** → **Web Service**.
2. Connect the same Git repository.
3. Configure the service:
   - **Name**: `fs02-workspace-web`
   - **Region**: Same region as database (e.g. `Oregon`).
   - **Branch**: `main`.
   - **Runtime**: `Node`.
   - **Build Command**:
     ```bash
     npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run start
     ```
   - **Plan**: `Free`.
4. Add **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | |
   | `DATABASE_URL` | Paste **Internal Database URL** from Step 1 | Connects to Postgres |
   | `AUTH_SECRET` | Same random string generated in Step 2 | Matches Collab Service |
   | `AUTH_TRUST_HOST` | `true` | Allows Render subdomains |
   | `NEXT_PUBLIC_COLLAB_URL` | `wss://fs02-workspace-collab.onrender.com` | Collab URL from Step 2 |
5. Health Check Path: `/api/auth/providers` (returns HTTP 200).
6. Click **Create Web Service**.

---

## Environment Variables Reference

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgres://user:pass@dpg-xxx:5432/fs02` |
| `AUTH_SECRET` | Yes | 32+ char secret for JWT and session tokens | `openssl rand -hex 32` |
| `AUTH_TRUST_HOST` | Yes | Tells Auth.js to trust the Render reverse proxy host | `true` |
| `NEXT_PUBLIC_COLLAB_URL` | Yes | Public WebSocket URL for Yjs collaborative editor | `wss://fs02-workspace-collab.onrender.com` |
| `REDIS_URL` | Optional | Redis pub/sub URL for scaling multiple collab instances | `redis://default:pass@redis.render.com:6379` |
| `PORT` | Auto | Assigned automatically by Render on each web service | Auto-handled by app |

---

## Verification & First Login

Once deployed:

1. **Visit your Web URL**: Open `https://fs02-workspace-web.onrender.com` in your browser.
2. **Register a New Account**: Navigate to `/register` or `/login` to create your initial user and workspace.
3. **Verify Collaborative Editing**:
   - Open a document in two separate browser tabs or private windows.
   - Verify that text edits, presence cursors, and comments synchronize in real time over WebSockets!
4. **Verify Projects & Kanban**:
   - Create a project card, upload files, and drag tasks across the Kanban board.
