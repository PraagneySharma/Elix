import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { RelayConfig } from "./config.js";
import {
  consoleRelaySecuritySink,
  emitRelaySecurityEvent,
  type RelaySecuritySink,
  type RelaySecuritySurface,
} from "./security-event.js";

const jwksByIssuer = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

function jwksForIssuer(issuer: string): ReturnType<typeof createRemoteJWKSet> {
  const existing = jwksByIssuer.get(issuer);
  if (existing) return existing;
  const created = createRemoteJWKSet(
    new URL(".well-known/jwks.json", issuer),
    { timeoutDuration: 5_000 },
  );
  jwksByIssuer.set(issuer, created);
  return created;
}

export interface AuthenticatedRequest extends Request {
  auth?: {
    subject: string;
    scopes: Set<string>;
    claims: JWTPayload;
  };
}

export function subjectIsAllowedIdentity(
  config: RelayConfig,
  subject: string,
): boolean {
  return (
    config.ELIX_AUTH0_ALLOWED_SUBJECTS.includes(subject) ||
    config.ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES.some((prefix) =>
      subject.startsWith(prefix),
    )
  );
}

function bearerToken(request: Request): string | null {
  const header = request.header("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

// Accept either version of Elix's established OAuth scopes during a staged
// Auth0 migration. Both tokens must still pass issuer, audience, identity,
// signature, and expiration checks before this scope comparison.
const compatibleScopes: Readonly<Record<string, string>> = {
  "veronica:access": "elix:access",
  "elix:access": "veronica:access",
  "veronica:device": "elix:device",
  "elix:device": "veronica:device",
};

export function scopeSatisfiesRequirement(
  config: RelayConfig,
  requiredScope: string | undefined,
  granted: ReadonlySet<string>,
): boolean {
  if (!requiredScope) return true;
  if (granted.has(requiredScope)) return true;
  if (
    requiredScope !== config.ELIX_MCP_REQUIRED_SCOPE &&
    requiredScope !== config.ELIX_DEVICE_ENROLL_SCOPE
  ) return false;
  const equivalent = compatibleScopes[requiredScope];
  return equivalent !== undefined && granted.has(equivalent);
}

function scopes(payload: JWTPayload): Set<string> {
  const claim = typeof payload.scope === "string" ? payload.scope : "";
  return new Set(claim.split(/\s+/).filter(Boolean));
}

function authenticationChallenge(
  config: RelayConfig,
  error?: "invalid_token" | "insufficient_scope",
  requiredScope?: string,
): string {
  const origin = config.ELIX_PUBLIC_ORIGIN.replace(/\/$/, "");
  const parameters = [
    `resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
    ...(error ? [`error="${error}"`] : []),
    ...(requiredScope ? [`scope="${requiredScope}"`] : []),
  ];
  return `Bearer ${parameters.join(", ")}`;
}

function securitySurface(
  config: RelayConfig,
  requiredScope: string | undefined,
): RelaySecuritySurface {
  return requiredScope === config.ELIX_MCP_REQUIRED_SCOPE
    ? "mcp_oauth"
    : "device_enrollment_oauth";
}

export function requireAuth(
  config: RelayConfig,
  requiredScope?: string,
  securitySink?: RelaySecuritySink,
) {
  const issuer = config.ELIX_AUTH0_ISSUER.endsWith("/")
    ? config.ELIX_AUTH0_ISSUER
    : `${config.ELIX_AUTH0_ISSUER}/`;
  const jwks = jwksForIssuer(issuer);
  const surface = securitySurface(config, requiredScope);
  const activeSecuritySink = securitySink ??
    (config.NODE_ENV === "production" ? consoleRelaySecuritySink : undefined);

  return async (
    request: AuthenticatedRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    const token = bearerToken(request);
    if (!token) {
      emitRelaySecurityEvent(
        activeSecuritySink,
        surface,
        "authentication_required",
      );
      response.setHeader(
        "WWW-Authenticate",
        authenticationChallenge(config),
      );
      response.status(401).json({ error: "authentication_required" });
      return;
    }

    try {
      const verified = await jwtVerify(token, jwks, {
        issuer,
        audience: config.ELIX_AUTH0_AUDIENCE,
      });
      if (!verified.payload.sub) throw new Error("Missing subject.");
      if (!subjectIsAllowedIdentity(config, verified.payload.sub)) {
        emitRelaySecurityEvent(
          activeSecuritySink,
          surface,
          "identity_not_allowed",
        );
        response.status(403).json({ error: "identity_provider_not_allowed" });
        return;
      }
      const grantedScopes = scopes(verified.payload);
      if (!scopeSatisfiesRequirement(config, requiredScope, grantedScopes)) {
        emitRelaySecurityEvent(
          activeSecuritySink,
          surface,
          "insufficient_scope",
        );
        response.setHeader(
          "WWW-Authenticate",
          authenticationChallenge(config, "insufficient_scope", requiredScope),
        );
        response.status(403).json({ error: "insufficient_scope" });
        return;
      }
      request.auth = {
        subject: verified.payload.sub,
        scopes: grantedScopes,
        claims: verified.payload,
      };
      next();
    } catch {
      emitRelaySecurityEvent(
        activeSecuritySink,
        surface,
        "invalid_token",
      );
      response.setHeader(
        "WWW-Authenticate",
        authenticationChallenge(config, "invalid_token"),
      );
      response.status(401).json({ error: "invalid_token" });
    }
  };
}
