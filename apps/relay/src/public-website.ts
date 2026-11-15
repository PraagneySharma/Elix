// Redirect browser-facing documentation off the MCP relay without affecting
// authentication, pairing, health checks, or remote tool requests.
const SITE_ORIGIN = "https://elix-eight.vercel.app";
const publicPaths = new Set([
  "/", "/privacy", "/security", "/support", "/terms", "/get-started",
  "/install", "/install.sh", "/install.ps1",
]);

export function publicWebsiteRedirect(
  method: string,
  pathname: string,
  originalUrl: string,
): string | null {
  if (method !== "GET" && method !== "HEAD") return null;
  if (!publicPaths.has(pathname) && !pathname.startsWith("/docs/")) return null;
  if (!originalUrl.startsWith("/") || originalUrl.startsWith("//")) return null;
  return `${SITE_ORIGIN}${originalUrl}`;
}
