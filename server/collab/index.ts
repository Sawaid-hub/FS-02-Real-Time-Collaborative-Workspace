import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import Redis from "ioredis";
import { prisma } from "../../lib/db";
import { pageIdFromRoom } from "../../lib/collab/rooms";
import { verifyCollabToken } from "../../lib/collab/token";
import { canEdit, canView } from "../../lib/permissions";
import type { Role } from "@prisma/client";

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;
const INSTANCE_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* environment may already be set */
  }
}

loadEnv();

type RoomState = {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  sockets: Set<WebSocket>;
  persistTimer: NodeJS.Timeout | null;
  pageId: string;
};

const rooms = new Map<string, RoomState>();
const socketMeta = new WeakMap<
  WebSocket,
  { room: string; role: Role; userId: string }
>();

let redisPub: Redis | null = null;
let redisSub: Redis | null = null;

if (process.env.REDIS_URL) {
  const redisOptions = {
    maxRetriesPerRequest: 1,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 500, 2000);
    },
  };
  redisPub = new Redis(process.env.REDIS_URL, redisOptions);
  redisSub = new Redis(process.env.REDIS_URL, redisOptions);
  redisPub.on("error", (err) => console.warn("collab redisPub warning:", err.message));
  redisSub.on("error", (err) => console.warn("collab redisSub warning:", err.message));
  redisSub.subscribe("fs02-collab").catch((err: unknown) => {
    console.error("collab redis subscribe failed", err);
  });
  redisSub.on("message", (channel, message) => {
    if (channel !== "fs02-collab") return;
    try {
      const parsed = JSON.parse(message) as {
        origin: string;
        room: string;
        kind: "update" | "awareness";
        data: string;
      };
      if (parsed.origin === INSTANCE_ID) return;
      const room = rooms.get(parsed.room);
      if (!room) return;
      const bytes = Buffer.from(parsed.data, "base64");
      if (parsed.kind === "update") {
        Y.applyUpdate(room.doc, bytes, "redis");
      } else {
        awarenessProtocol.applyAwarenessUpdate(room.awareness, bytes, "redis");
      }
    } catch (err) {
      console.error("collab redis message error", err);
    }
  });
  console.log("collab redis connected");
} else {
  console.log("collab redis disabled: REDIS_URL not set");
}

function publish(room: string, kind: "update" | "awareness", data: Uint8Array) {
  if (!redisPub) return;
  redisPub
    .publish(
      "fs02-collab",
      JSON.stringify({
        origin: INSTANCE_ID,
        room,
        kind,
        data: Buffer.from(data).toString("base64"),
      }),
    )
    .catch((err: unknown) => console.error("collab redis publish failed", err));
}

function send(ws: WebSocket, data: Uint8Array) {
  if (ws.readyState === ws.OPEN) {
    ws.send(data);
  }
}

function schedulePersist(room: RoomState) {
  if (room.persistTimer) {
    clearTimeout(room.persistTimer);
  }
  room.persistTimer = setTimeout(() => {
    room.persistTimer = null;
    const update = Y.encodeStateAsUpdate(room.doc);
    prisma.page
      .update({
        where: { id: room.pageId },
        data: { yDoc: Buffer.from(update) },
      })
      .catch((err: unknown) => console.error("collab persist failed", err));
  }, 2000);
}

async function getRoom(roomName: string, pageId: string): Promise<RoomState> {
  const existing = rooms.get(roomName);
  if (existing) return existing;

  const doc = new Y.Doc();
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (page && page.yDoc.length > 0) {
    Y.applyUpdate(doc, new Uint8Array(page.yDoc), "load");
  }
  const awareness = new awarenessProtocol.Awareness(doc);
  const state: RoomState = {
    doc,
    awareness,
    sockets: new Set(),
    persistTimer: null,
    pageId,
  };

  doc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== "redis" && origin !== "load") {
      publish(roomName, "update", update);
      schedulePersist(state);
    }
    if (origin === "redis") {
      schedulePersist(state);
    }
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const payload = encoding.toUint8Array(encoder);
    for (const sock of state.sockets) {
      if (origin !== sock) {
        send(sock, payload);
      }
    }
  });

  awareness.on(
    "update",
    ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
      const changed = added.concat(updated, removed);
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changed);
      if (origin !== "redis") {
        publish(roomName, "awareness", update);
      }
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_AWARENESS);
      encoding.writeVarUint8Array(encoder, update);
      const payload = encoding.toUint8Array(encoder);
      for (const sock of state.sockets) {
        if (origin !== sock) {
          send(sock, payload);
        }
      }
    },
  );

  rooms.set(roomName, state);
  return state;
}

function handleSync(ws: WebSocket, room: RoomState, decoder: decoding.Decoder, role: Role) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MSG_SYNC);
  const messageType = decoding.readVarUint(decoder);
  if (messageType === syncProtocol.messageYjsSyncStep1) {
    syncProtocol.writeSyncStep2(encoder, room.doc);
    send(ws, encoding.toUint8Array(encoder));
    return;
  }
  if (!canEdit(role)) {
    return;
  }
  if (messageType === syncProtocol.messageYjsSyncStep2) {
    Y.applyUpdate(room.doc, decoding.readVarUint8Array(decoder), ws);
    return;
  }
  if (messageType === syncProtocol.messageYjsUpdate) {
    Y.applyUpdate(room.doc, decoding.readVarUint8Array(decoder), ws);
  }
}

const port = Number(process.env.PORT ?? process.env.COLLAB_PORT ?? 1234);
const server = createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("fs02-collab");
});

const wss = new WebSocketServer({ server });

wss.on("connection", async (ws, req) => {
  try {
    const url = new URL(req.url ?? "/", "http://collab.local");
    const roomName = decodeURIComponent(url.pathname.replace(/^\//, ""));
    const token = url.searchParams.get("token");
    const pageId = pageIdFromRoom(roomName);
    if (!token || !pageId) {
      console.log("collab deny: missing token or room", roomName);
      ws.close(4001, "unauthorized");
      return;
    }
    const claims = await verifyCollabToken(token);
    if (claims.pageId !== pageId || !canView(claims.role)) {
      console.log("collab deny: token mismatch", { pageId, userId: claims.sub });
      ws.close(4003, "forbidden");
      return;
    }
    const membership = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        workspace: {
          include: {
            memberships: { where: { userId: claims.sub } },
          },
        },
      },
    });
    const liveRole = membership?.workspace.memberships[0]?.role ?? null;
    if (!canView(liveRole)) {
      console.log("collab deny: no membership", { pageId, userId: claims.sub });
      ws.close(4003, "forbidden");
      return;
    }

    const room = await getRoom(roomName, pageId);
    room.sockets.add(ws);
    socketMeta.set(ws, { room: roomName, role: liveRole, userId: claims.sub });
    console.log("collab connect", { room: roomName, userId: claims.sub, role: liveRole });

    const step1 = encoding.createEncoder();
    encoding.writeVarUint(step1, MSG_SYNC);
    syncProtocol.writeSyncStep1(step1, room.doc);
    send(ws, encoding.toUint8Array(step1));

    const awarenessStates = room.awareness.getStates();
    if (awarenessStates.size > 0) {
      const aw = encoding.createEncoder();
      encoding.writeVarUint(aw, MSG_AWARENESS);
      encoding.writeVarUint8Array(
        aw,
        awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...awarenessStates.keys()]),
      );
      send(ws, encoding.toUint8Array(aw));
    }

    ws.on("message", (raw) => {
      const meta = socketMeta.get(ws);
      if (!meta) return;
      const decoder = decoding.createDecoder(new Uint8Array(raw as Buffer));
      const messageType = decoding.readVarUint(decoder);
      if (messageType === MSG_SYNC) {
        handleSync(ws, room, decoder, meta.role);
      } else if (messageType === MSG_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(
          room.awareness,
          decoding.readVarUint8Array(decoder),
          ws,
        );
      }
    });

    ws.on("close", () => {
      room.sockets.delete(ws);
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        [...room.awareness.getStates().entries()]
          .filter(([, value]) => {
            const user = (value as { user?: { id?: string } }).user;
            return user?.id === claims.sub;
          })
          .map(([clientId]) => clientId),
        "closed",
      );
      console.log("collab disconnect", { room: roomName, userId: claims.sub });
    });
  } catch (err) {
    console.error("collab connection error", err);
    ws.close(4001, "unauthorized");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`collab listening on 0.0.0.0:${port} instance=${INSTANCE_ID}`);
});
