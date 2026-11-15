# Privacy policy

Elix routes requests between an authenticated ChatGPT or MCP client and a local project that you explicitly expose from your computer.

*Last updated November 12, 2026*

Public Elix does not support processing payment-card data subject to PCI DSS, protected health information, government identifiers, access credentials, or authentication secrets. Do not expose a workspace containing those categories to the public app. See [Security and permissions](/security).

## Data Elix processes

Elix processes:

- Account identity supplied by Auth0.
- Device metadata such as a device ID, chosen name, platform, creation time, last-seen time, and revocation status.
- Active routing metadata such as an ephemeral worker ID, selected access profile, optional user-supplied label, worker version, capabilities, connection generation, and liveness state. Elix does not derive or transmit a repository name or local absolute root.
- Metadata-only security audit records, limited to event type, status, timestamp, and related account or device identifiers.
- Tool requests and responses in transit, including relative paths, text file contents, bounded image bytes returned by `view_image`, command arguments, command input, and captured command output. Elix may check text for recognizable authentication-secret patterns so it can block accidental disclosure. Image pixels and embedded metadata are not OCR-scanned or metadata-scrubbed by that text detector.
- Network and service metadata processed by hosting and authentication providers, such as IP address, request time, client information, and error status.
- Aggregate daily usage counts for the whole service, such as MCP requests, tool calls, pairings, and the peak number of connected workspaces. These counts carry no account, device, path, or tool-argument information.

## How data is used

Elix uses this data to authenticate users, enroll devices, route requests, enforce the selected access profile, perform requested workspace operations, prevent abuse, diagnose failures, and maintain service security.

Elix does not sell personal data, serve advertisements, or use workspace content to train models.

## Storage and retention

File contents, command arguments, command input, command output, local absolute paths, environment variables, OAuth access tokens, and device or worker bearer secrets are not intentionally written to Elix's durable database. Request content remains in relay process memory only while an authenticated operation is queued or awaiting its result. It is removed when the operation completes or times out, the worker disconnects or reconnects, the device is revoked, or the relay process restarts. The relay is not a durable job queue.

Account, device, and audit metadata are retained for the life of the account or service, or until an account-deletion request is completed. Revoking a device prevents further use of its credential but does not by itself erase the device metadata. Elix does not currently apply a shorter automatic expiration period to audit metadata. Aggregate daily usage counts are kept for the life of the service.

Active worker IDs, profiles, labels, capabilities, command routes, pending jobs, command output, and liveness state are held only in relay memory. When recognizable authentication data is blocked, the matched content is not returned to the client.

The Elix CLI stores OAuth and device credentials on the user's computer using the operating-system credential store when available. If that store is unavailable, the CLI warns before using a restricted local credential file.

## Service providers

Elix relies on Auth0 for authentication, Render for the managed relay, a hosted PostgreSQL database for account and device metadata, Vercel for the public website, and npm for CLI distribution. The relay and hosting providers process operational metadata, including IP address, request time, path, and status, under their respective privacy and retention policies. The source repository is private during the beta. These providers process the data needed for their part of the service under their own terms and privacy practices.

ChatGPT or another connected MCP client receives the file contents, command details, and command output returned in response to its requests. That client processes and retains data under its own terms, privacy policy, workspace settings, and model-data controls.

## Your controls

- Choose `read-only`, `workspace`, or explicit `system` access for each worker.
- Stop the worker with Ctrl+C or `q`.
- Run `elix unpair` to revoke this computer's device credential and remove its local copy.
- Press `d` in any paired Elix terminal to list and revoke the account's devices.
- Disconnect Elix in ChatGPT to revoke the client's authorization.
- Request device or account deletion through [support](/support).

## Security

The relay and worker independently enforce the selected access profile. `system` commands inherit the operating-system authority of the account that starts the worker and are not confined to the selected root. Read [Security and permissions](/security) before enabling commands.

## Children

Elix is a developer tool and is not directed to children under 13. Do not use Elix to submit personal data about a child who cannot legally consent to that processing.

## Changes and contact

Material changes will be published on this page with a new revision date. Questions and data requests can be started through [support](/support).
