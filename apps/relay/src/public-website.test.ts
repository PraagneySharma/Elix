import assert from "node:assert/strict";
import test from "node:test";
import { publicWebsiteRedirect } from "./public-website.js";

test("redirects only public browser-facing pages", () => {
  for (const path of ["/", "/docs/quickstart", "/docs/developer-mode", "/security", "/support", "/privacy", "/terms", "/get-started", "/install", "/install.ps1", "/install.sh"]) {
    assert.equal(publicWebsiteRedirect("GET", path, path), `https://elix-eight.vercel.app${path}`);
  }
  assert.equal(publicWebsiteRedirect("HEAD", "/docs/quickstart", "/docs/quickstart?src=old"), "https://elix-eight.vercel.app/docs/quickstart?src=old");
});

test("never redirects MCP, OAuth, panel, device, health, or unsafe paths", () => {
  for (const path of ["/mcp", "/panel", "/panel/pair", "/v1/devices", "/healthz", "/.well-known/oauth-protected-resource", "/favicon.ico", "/docs-other"]) {
    assert.equal(publicWebsiteRedirect("GET", path, path), null, path);
  }
  assert.equal(publicWebsiteRedirect("POST", "/docs/quickstart", "/docs/quickstart"), null);
  assert.equal(publicWebsiteRedirect("GET", "/docs/quickstart", "//attacker.example"), null);
});
