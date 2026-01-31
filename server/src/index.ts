import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";

import "./db/sqlite.js"; // initializes DB & schema
import { workspacesRouter } from "./routes/workspaces.js";
import { sectionsRouter } from "./routes/sections.js";
import { commandsRouter } from "./routes/commands.js";

const app = express();
const port = Number(process.env.PORT || 5179);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/workspaces", workspacesRouter);
app.use("/api/sections", sectionsRouter);
app.use("/api/commands", commandsRouter);

/**
 * Production: serve client build from ../client/dist
 * Portable: still all inside project folder.
 */
const clientDist = path.resolve(process.cwd(), "../client/dist");
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.listen(port, () => {
    console.log(`Command Vault server running on http://localhost:${port}`);
});
