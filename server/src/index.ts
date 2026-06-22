import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";

import "./db/sqlite.js"; // initializes DB & schema
import { workspacesRouter } from "./routes/workspaces.js";
import { sectionsRouter } from "./routes/sections.js";
import { commandsRouter } from "./routes/commands.js";
import { authRouter } from "./routes/auth.js";
import { dataRouter } from "./routes/data.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const port = Number(process.env.PORT || 5179);

const allowedOrigin = process.env.CORS_ORIGIN || true; // true = reflect request origin (fine for local/LAN tool)

app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, version: "2.0.0" }));

// Auth endpoints are always reachable (login/status must work before auth is granted)
app.use("/api/auth", authRouter);

// Everything else under /api requires a valid session ONLY if auth has been enabled
// in settings (requireAuth is a no-op when auth is disabled).
app.use("/api/workspaces", requireAuth, workspacesRouter);
app.use("/api/sections", requireAuth, sectionsRouter);
app.use("/api/commands", requireAuth, commandsRouter);
app.use("/api/data", dataRouter); // dataRouter applies requireAuth per-route internally

/**
 * Production: serve client build from ../client/dist
 * Portable: still all inside project folder.
 */
const clientDist = path.resolve(process.cwd(), "../client/dist");
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

// Global error handler: turns thrown validation errors (parseOrThrow) and any
// other synchronous route error into a clean JSON 400 instead of crashing
// the process or returning Express's default HTML error page.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[error]", err?.message ?? err);
    const status = err?.status ?? 400;
    res.status(status).json({ error: err?.message ?? "Unexpected server error" });
});

app.listen(port, () => {
    console.log(`Command Vault server running on http://localhost:${port}`);
});
