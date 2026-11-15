import { z } from "zod";
import {
  DEFAULT_WORKER_POLL_MS,
  MAX_WORKER_POLL_MS,
} from "@elix/protocol";

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    ELIX_BIND_HOST: z.string().trim().min(1).max(255).default("127.0.0.1"),
    PORT: z.coerce.number().int().positive().max(65535).default(39100),
    DATABASE_URL: z.string().min(1),
    ELIX_DATABASE_CA_PEM: z.string().trim().min(1).optional(),
    ELIX_PUBLIC_ORIGIN: z.string().url(),
    ELIX_AUTH0_ISSUER: z.string().url(),
    ELIX_AUTH0_AUDIENCE: z.string().url(),
    ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES: z
      .string()
      .trim()
      .min(2)
      .max(2048)
      .optional(),
    // Exact identities are useful for tightly scoped reviewer or service accounts.
    ELIX_AUTH0_ALLOWED_SUBJECTS: z
      .string()
      .trim()
      .min(3)
      .max(8192)
      .optional(),
    ELIX_MCP_REQUIRED_SCOPE: z.string().default("veronica:access"),
    ELIX_DEVICE_ENROLL_SCOPE: z.string().default("veronica:device"),
    ELIX_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60_000),
    ELIX_ENROLL_RATE_LIMIT: z.coerce.number().int().positive().default(10),
    ELIX_DEVICE_AUTH_RATE_LIMIT: z.coerce
      .number()
      .int()
      .positive()
      .default(120),
    ELIX_MCP_RATE_LIMIT: z.coerce.number().int().positive().default(300),
    ELIX_IP_RATE_LIMIT: z.coerce.number().int().positive().default(1200),
    ELIX_MAX_WORKERS: z.coerce.number().int().positive().default(2000),
    ELIX_MAX_WORKERS_PER_ACCOUNT: z.coerce
      .number()
      .int()
      .positive()
      .default(16),
    ELIX_WORKER_POLL_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(MAX_WORKER_POLL_MS)
      .default(DEFAULT_WORKER_POLL_MS),
    ELIX_RELAY_REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(19_000)
      .default(18_000),
    ELIX_TIMING_LOGS: z
      .enum(["0", "1"])
      .default("0")
      .transform((value) => value === "1"),
    // Optional OpenAI plugin-domain verification token. The public route is
    // absent unless this is configured, and returns only this exact value.
    ELIX_OPENAI_APPS_CHALLENGE: z.string().trim().min(1).max(4096).optional(),
    // The control panel is enabled only when all three values are set.
    ELIX_PANEL_CLIENT_ID: z.string().trim().min(1).max(255).optional(),
    ELIX_PANEL_CLIENT_SECRET: z
      .string()
      .trim()
      .min(1)
      .max(1024)
      .optional(),
    ELIX_PANEL_SESSION_SECRET: z.string().min(32).max(1024).optional(),
  })
  .superRefine((environment, context) => {
    if (
      environment.NODE_ENV === "production" &&
      new URL(environment.ELIX_PUBLIC_ORIGIN).protocol !== "https:"
    ) {
      context.addIssue({
        code: "custom",
        path: ["ELIX_PUBLIC_ORIGIN"],
        message: "Production public origin must use HTTPS.",
      });
    }
    const panelValues = [
      environment.ELIX_PANEL_CLIENT_ID,
      environment.ELIX_PANEL_CLIENT_SECRET,
      environment.ELIX_PANEL_SESSION_SECRET,
    ];
    if (panelValues.some((value) => value !== undefined) && panelValues.some((value) => value === undefined)) {
      context.addIssue({
        code: "custom",
        path: ["ELIX_PANEL_CLIENT_ID"],
        message: "The control panel requires all three ELIX_PANEL_* variables.",
      });
    }
  });

type ParsedEnvironment = z.infer<typeof environmentSchema>;

const auth0SubjectPrefixSchema = z
  .string()
  .trim()
  .min(2)
  .max(128)
  .refine((value) => value.endsWith("|"), {
    message: "Auth0 subject prefix must end with |.",
  });

const auth0ExactSubjectSchema = z
  .string()
  .trim()
  .min(3)
  .max(255)
  .regex(/^[^\s,|]+\|[^\s,]+$/, {
    message: "Exact Auth0 subjects must include a provider prefix and user identifier.",
  });

export interface PanelConfig {
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
}

export type RelayConfig = Omit<
  ParsedEnvironment,
  | "ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES"
  | "ELIX_AUTH0_ALLOWED_SUBJECTS"
  | "ELIX_PANEL_CLIENT_ID"
  | "ELIX_PANEL_CLIENT_SECRET"
  | "ELIX_PANEL_SESSION_SECRET"
> & {
  ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES: readonly string[];
  ELIX_AUTH0_ALLOWED_SUBJECTS: readonly string[];
  ELIX_PANEL: PanelConfig | undefined;
};

function commaSeparatedValues(
  raw: string,
  schema: z.ZodType<string>,
  maximum: number,
  duplicateMessage: string,
): string[] {
  return z
    .array(schema)
    .min(1)
    .max(maximum)
    .refine((values) => new Set(values).size === values.length, {
      message: duplicateMessage,
    })
    .parse(raw.split(",").map((value) => value.trim()));
}

function allowedSubjectPrefixes(environment: ParsedEnvironment): string[] {
  const raw = environment.ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES ?? "google-oauth2|";
  return commaSeparatedValues(
    raw,
    auth0SubjectPrefixSchema,
    8,
    "Auth0 subject prefixes must be unique.",
  );
}

function allowedExactSubjects(environment: ParsedEnvironment): string[] {
  if (!environment.ELIX_AUTH0_ALLOWED_SUBJECTS) return [];
  return commaSeparatedValues(
    environment.ELIX_AUTH0_ALLOWED_SUBJECTS,
    auth0ExactSubjectSchema,
    32,
    "Exact Auth0 subjects must be unique.",
  );
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): RelayConfig {
  // Existing deployments may still define the prior product's environment keys.
  // New ELIX_* settings always take precedence during the migration.
  const normalizedEnvironment = { ...environment };
  for (const [key, value] of Object.entries(environment)) {
    if (!key.startsWith("VERONICA_")) continue;
    const modernKey = `ELIX_${key.slice("VERONICA_".length)}`;
    if (normalizedEnvironment[modernKey] === undefined) normalizedEnvironment[modernKey] = value;
  }
  if (normalizedEnvironment.ELIX_AUTH0_ALLOWED_SUBJECT_PREFIX !== undefined) {
    throw new Error(
      "ELIX_AUTH0_ALLOWED_SUBJECT_PREFIX has been removed. Use ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES instead.",
    );
  }
  const parsed = environmentSchema.parse(normalizedEnvironment);
  const {
    ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES: _pluralInput,
    ELIX_AUTH0_ALLOWED_SUBJECTS: _exactInput,
    ELIX_PANEL_CLIENT_ID: panelClientId,
    ELIX_PANEL_CLIENT_SECRET: panelClientSecret,
    ELIX_PANEL_SESSION_SECRET: panelSessionSecret,
    ...config
  } = parsed;
  return {
    ...config,
    ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES: allowedSubjectPrefixes(parsed),
    ELIX_AUTH0_ALLOWED_SUBJECTS: allowedExactSubjects(parsed),
    ELIX_PANEL:
      panelClientId && panelClientSecret && panelSessionSecret
        ? {
            clientId: panelClientId,
            clientSecret: panelClientSecret,
            sessionSecret: panelSessionSecret,
          }
        : undefined,
  };
}
