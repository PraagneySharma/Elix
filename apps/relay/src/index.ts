import express from "express";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { Store } from "./store.js";
import { RouterState } from "./router-state.js";
import { buildRoutes, MAX_RELAY_JSON_BYTES } from "./routes.js";
import { buildPanel } from "./panel.js";
import { log, safeErrorFields } from "./log.js";
import { requestErrorHandler } from "./request-errors.js";
import { UsageCounters } from "./usage-counters.js";
import { publicWebsiteRedirect } from "./public-website.js";

process.on("uncaughtException", (error) => {
  log("error", "uncaught_exception", safeErrorFields(error));
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  log("error", "unhandled_rejection", safeErrorFields(reason));
  process.exit(1);
});

const config = loadConfig();
const store = new Store(config.DATABASE_URL);
const state = new RouterState({
  maxWorkers: config.ELIX_MAX_WORKERS,
  maxWorkersPerAccount: config.ELIX_MAX_WORKERS_PER_ACCOUNT,
});
const usage = new UsageCounters({
  write: (rows) => store.recordUsage(rows),
  online: () => state.onlineTotals(),
});

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: MAX_RELAY_JSON_BYTES }));
const panel = buildPanel(config, store, state);
if (panel) app.use("/panel", panel);

// Documentation lives on Vercel; protected routes remain on the relay.
app.use((request, response, next) => {
  const destination = publicWebsiteRedirect(
    request.method,
    request.path,
    request.originalUrl,
  );
  if (destination) {
    response.redirect(302, destination);
    return;
  }
  next();
});
// Documentation and public assets share the relay hostname. Do not allow
// static files to shadow the protected MCP, worker, or control-panel routes.
const publicSite = express.static(
  fileURLToPath(new URL("../../../../site/", import.meta.url)),
  { extensions: ["html"], index: false, dotfiles: "deny", redirect: false },
);
app.use((request, response, next) => {
  if (
    request.path === "/" ||
    request.path === "/mcp" ||
    request.path === "/panel" ||
    request.path.startsWith("/panel/") ||
    request.path.startsWith("/v1/") ||
    request.path.startsWith("/.well-known/")
  ) {
    next();
    return;
  }
  publicSite(request, response, next);
});
app.use(buildRoutes(config, store, state, { usage }));
app.use(requestErrorHandler());

const server = app.listen(config.PORT, config.ELIX_BIND_HOST, () => {
  log("info", "relay_started", {
    host: config.ELIX_BIND_HOST,
    port: config.PORT,
  });
  usage.start();
});

async function shutdown(signal: string): Promise<void> {
  log("info", "relay_stopping", { signal });
  usage.stop();
  setTimeout(() => process.exit(1), 10_000).unref();
  // Flush before closing: open long polls can hold close past the deadline.
  await usage.flush();
  server.close(async () => {
    await usage.flush();
    await store.close();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
