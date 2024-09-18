import http from "http";
import process from "process";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
if (!FINNHUB_API_KEY) {
  throw new Error("FINNHUB_API_KEY is required");
}

const REST_BASE = (process.env.FINNHUB_REST_BASE || "https://finnhub.io/api/v1").replace(/\/+$/, "");
const WS_BASE = (process.env.FINNHUB_WS_BASE || "wss://ws.finnhub.io").replace(/\/+$/, "");
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
const PORT = Number(process.env.PORT || 8080);
const RATE_LIMIT_REQUESTS = Number(process.env.RATE_LIMIT_REQUESTS || 60);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);

const ALLOWED_PATHS = new Set(["/quote", "/stock/market-status", "/search"]);
const rateBuckets = new Map();

const app = express();

app.disable("x-powered-by");

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    handleCors(req, res);
    res.status(204).end();
    return;
  }

  const originAllowed = handleCors(req, res);
  if (!originAllowed) {
    res.status(403).json({ error: "Forbidden origin" });
    return;
  }

  next();
});

app.get("/healthz", (_, res) => {
  res.type("text/plain").send("ok");
});

app.get("/api/*", async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const upstreamPath = req.path.replace(/^\/api/, "");
  if (!ALLOWED_PATHS.has(upstreamPath)) {
    res.status(403).json({ error: "Endpoint not available", path: upstreamPath });
    return;
  }

  const clientId = getClientId(req.headers, req.socket);
  const rate = consumeToken(clientId);
  attachRateHeaders(res, rate);
  if (!rate.allowed) {
    res.setHeader("Retry-After", Math.max(1, Math.ceil(rate.retryAfter / 1000)));
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  try {
    const searchParams = new URLSearchParams(req.query);
    searchParams.set("token", FINNHUB_API_KEY);

    const upstreamUrl = `${REST_BASE}${upstreamPath}?${searchParams.toString()}`;
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const body = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.set("Content-Type", upstreamResponse.headers.get("content-type") || "application/json");
    res.send(body);
  } catch (error) {
    console.error("REST proxy error:", error);
    res.status(502).json({ error: "Upstream service unreachable" });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (!req.url?.startsWith("/ws")) {
    socket.destroy();
    return;
  }

  if (!isOriginAllowed(req.headers.origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  const clientId = getClientId(req.headers, socket);
  const rate = consumeToken(clientId);
  if (!rate.allowed) {
    socket.write(
      `HTTP/1.1 429 Too Many Requests\r\nRetry-After: ${Math.max(1, Math.ceil(rate.retryAfter / 1000))}\r\n\r\n`,
    );
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (client, request) => {
  const upstreamUrl = `${WS_BASE}?token=${encodeURIComponent(FINNHUB_API_KEY)}`;
  const upstream = new WebSocket(upstreamUrl);
  const pending = [];
  let upstreamReady = false;

  upstream.on("open", () => {
    upstreamReady = true;
    while (pending.length > 0) {
      upstream.send(pending.shift());
    }
  });

  upstream.on("message", (data) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });

  upstream.on("close", (code, reason) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(code, reason.toString());
    }
  });

  upstream.on("error", (error) => {
    console.error("Upstream WS error:", error);
    if (client.readyState === WebSocket.OPEN) {
      client.close(1011, "Upstream error");
    }
  });

  client.on("message", (message) => {
    if (upstreamReady && upstream.readyState === WebSocket.OPEN) {
      upstream.send(message);
    } else {
      pending.push(message);
    }
  });

  client.on("close", () => {
    upstream.close();
  });

  client.on("error", () => {
    upstream.close();
  });
});

server.listen(PORT, () => {
  console.log(`Finnhub proxy listening on :${PORT}`);
});

function parseAllowedOrigins(raw = "") {
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin) {
  if (!origin || ALLOWED_ORIGINS.length === 0) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function handleCors(req, res) {
  const origin = req.headers.origin;
  const allowed = isOriginAllowed(origin);

  if (allowed && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else if (allowed && !origin && ALLOWED_ORIGINS.length === 0) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Credentials", "false");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");

  return allowed;
}

function getClientId(headers = {}, socket = {}) {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return socket.remoteAddress || "unknown";
}

function consumeToken(clientId = "unknown") {
  const now = Date.now();
  let bucket = rateBuckets.get(clientId);
  if (!bucket || now >= bucket.reset) {
    bucket = { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
    rateBuckets.set(clientId, bucket);
  }

  bucket.count += 1;
  const allowed = bucket.count <= RATE_LIMIT_REQUESTS;
  const remaining = Math.max(0, RATE_LIMIT_REQUESTS - bucket.count);
  return {
    allowed,
    remaining,
    reset: bucket.reset,
    retryAfter: bucket.reset - now,
  };
}

function attachRateHeaders(res, stats) {
  if (!res || !stats) return;
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, stats.remaining));
  res.setHeader("X-RateLimit-Reset", Math.ceil(stats.reset / 1000));
}
