import "dotenv/config";
import express, { Request, Response } from "express";
import { Socket } from "net";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import { apiReference } from "@scalar/express-api-reference";
import { requestLogger } from "./middleware/logger";
import { authMiddleware } from "./middleware/auth";
import { openApiSpec } from "./openapi";

const app = express();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? "http://auth:3001";
const USER_ORG_SERVICE_URL =
  process.env.USER_ORG_SERVICE_URL ?? "http://user-org:3002";
const EXPENSE_SERVICE_URL =
  process.env.EXPENSE_SERVICE_URL ?? "http://expense:3003";
const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL ?? "http://file:3005";

const injectHeaders = (proxyReq: any, req: Request) => {
  if (req.userId) proxyReq.setHeader("x-user-id", req.userId);
  if (req.userEmail) proxyReq.setHeader("x-user-email", req.userEmail);
};

const proxyError = (_err: Error, _req: Request, res: Response | Socket) => {
  if (res instanceof Socket) return;
  res.status(502).json({ error: "Upstream service unavailable" });
};

const ROUTE_MAP: { prefix: string; target: string }[] = [
  { prefix: '/api/auth',          target: AUTH_SERVICE_URL },
  { prefix: '/api/users',         target: USER_ORG_SERVICE_URL },
  { prefix: '/api/organisations', target: USER_ORG_SERVICE_URL },
  { prefix: '/api/invitations',   target: USER_ORG_SERVICE_URL },
  { prefix: '/api/expenses',      target: EXPENSE_SERVICE_URL },
  { prefix: '/api/files',         target: FILE_SERVICE_URL },
];

const resolveTarget = (path: string): string | null => {
  const match = ROUTE_MAP.find((r) => path.startsWith(r.prefix));
  return match ? match.target : null;
};

const proxy = createProxyMiddleware({
  changeOrigin: true,
  router: (req) => resolveTarget(req.originalUrl) ?? AUTH_SERVICE_URL,
  pathRewrite: (path) => path.replace(/^\/api/, ''),
  on: {
    proxyReq: injectHeaders,
    error: proxyError,
  },
});

app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use(requestLogger);

app.use("/internal", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "gateway" });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use("/docs", apiReference({ spec: { url: "/openapi.json" } }));

app.use(authMiddleware);
app.use('/api', proxy);



const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
