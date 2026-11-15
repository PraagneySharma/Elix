# Deploy Elix with free Render + Neon + Auth0 hosting

This guide prepares an independent Elix installation at **https://mcp.praagney.com**. Do not use the original application's production services or credentials.

## Before deploying

A Render account, an Auth0 tenant, a free PostgreSQL database at [Neon](https://neon.tech/), and DNS control of `praagney.com` are needed. The root `render.yaml` now defines **one Render Free web service and NO Render database**. Render's Free web service sleeps when idle and has monthly resource/usage limits. Render's Free PostgreSQL offering expires after 30 days, so this guide uses Neon Free instead. Neon Free has storage, compute and network limits and may suspend database compute on idle. These free tiers are appropriate for personal testing, **not guaranteed always-on production hosting**. Review Render's bandwidth billing and the current terms of both free plans; domain registration is a separate annual cost. Automatic deployments are off.

**Warning:** If you have an older Render Blueprint preview that still lists paid services, discard it and refresh the Blueprint from the latest `main` branch. Do not approve any plan unless the only Render resource is a **Free** web service.

## 1. Set up the Auth0 API

In Auth0 Dashboard:

1. Go to **Applications → APIs → Create API**.
2. Name: `Elix MCP`
3. Identifier (audience): `https://mcp.praagney.com/` (the trailing slash matters).
4. Choose the signed JWT option (RS256) and save.
5. Under Permissions, add scopes **`elix:access`** and **`elix:device`**, keeping the existing `veronica:access` and `veronica:device` scopes until all existing connections have migrated. This is a backward-compatible migration, not permission expansion for unrelated applications.

Find your Auth0 tenant domain in **Applications → Applications → Settings** (for example, `your-tenant.us.auth0.com`). The issuer configuration is `https://YOUR_TENANT_DOMAIN/` with the final slash.

### OAuth scope migration without disconnecting existing users

1. Keep the API identifier `https://mcp.praagney.com/`, issuer, audience, callback URLs, and current client grants unchanged.
2. In Auth0 **Applications → APIs → Elix MCP → Permissions**, add `elix:access` and `elix:device` while retaining the `veronica:*` permissions.
3. In the API's **Application Access** tab, grant approved clients `elix:access` under **User-Delegated Access** (and `elix:device` only if an approved OAuth device enrollment client actually needs it). Do not grant machine-to-machine access broadly.
4. Deploy the relay containing dual-scope verification and test both an existing client token carrying `veronica:access` and a newly authorized token carrying `elix:access`.
5. Only after the new grants work, set Render's `ELIX_MCP_REQUIRED_SCOPE=elix:access` and `ELIX_DEVICE_ENROLL_SCOPE=elix:device` to advertise the new permission names. The relay will continue accepting the corresponding old scopes until clients have been migrated. Update the private plugin's `baseScopes` and retest OAuth before publication.

**Do not switch the advertised scopes before Auth0 has the new permissions and grants:** token issuance can fail even when the relay is healthy.

## 2. Set up the pairing control panel in Auth0

1. Go to **Applications → Applications → Create Application**.
2. Name: `Elix Control Panel`.
3. Select **Regular Web Application**.
4. Under Settings, add Allowed Callback URLs: `https://mcp.praagney.com/panel/auth/callback`.
5. Add Allowed Logout URLs: `https://mcp.praagney.com/panel`.
6. Save and record the **Client ID** and **Client Secret** privately. **Do not paste the Client Secret into ChatGPT or commit it to GitHub.**

In **Authentication → Social**, enable `google-oauth2` for this application if you want Google sign-in. Auth0's developer Google keys should not be used for a live production application; replace them with your own Google OAuth credentials when ready.

### Private ChatGPT OAuth client

Keep the panel application separate. The private plugin uses the fixed **Elix ChatGPT** public client (`CthsztBpCdiDgT0rAPiGeHy5MnSFtIir`), reusing the tenant's previously unconfigured Default App. This Client ID is public configuration, not a secret.

- Application type: **Single Page Application**; token endpoint authentication: **None**. Use Authorization Code with PKCE S256, not Implicit or password grants.
- Allowed Callback URLs: exactly `https://chatgpt.com/connector_platform_oauth_redirect`. The tenant advertises issuer identification and returns `iss`, which supports this stable ChatGPT callback. Confirm the exact redirect shown by the MCP management page when changing connections; never add callback wildcards.
- Enable Google sign-in for this application. Keep the API's user-delegated policy at **Per-app authorization**. Grant this client only **`elix:access`** under **User-Delegated Access**, with no machine-to-machine or anonymous grant.
- Keep **Resource Parameter Compatibility Profile** and **Include Issuer in Authorization Responses** enabled. The resource/audience stays `https://mcp.praagney.com/`.
- `plugin/elix/mcp.json` selects `auth.client.mode=provided`, the fixed Client ID, and `tokenEndpointAuthMethod=none`. Update the existing private plugin from that package; do not create another connection using DCR.

The `invalid_request` error saying a `tpc_...` client is not authorized for this resource is an Auth0 API client-grant failure, before Elix receives a token. DCR registers a client but does not grant API access. To repair an **existing DCR-created ChatGPT connection**, go to **Applications > APIs > the Elix/Veronica API > Application Access**, find that exact dynamically registered ChatGPT client, and grant **User-Delegated Access** with only the currently advertised scope (`veronica:access` on the existing hosted relay). Leave **Client Access (M2M)** unauthorized. Save, then use **Continue connecting app** in ChatGPT; do not recreate the plugin unless the client has expired or has been removed. An OAuth error before Google login is not a pairing failure.

For new beta testers, prefer the separately configured fixed OAuth client (`plugin/elix/mcp.json`) rather than letting every tester dynamically register a client. Do not enable default third-party grants for all registered clients until you have independently verified a strict, exact-subject allowlist on the live relay. In the codebase, the fallback allowed subject prefix is `google-oauth2|`; that default is **not** an invite-only policy. Per-client grants avoid expanding authorization to arbitrary dynamically registered apps.

References: [OpenAI plugin authentication](https://developers.openai.com/plugins/build/auth) and [Auth0 API access policies](https://auth0.com/blog/developers-guide-api-access-policies-auth0/). Keep the plugin private; saving a package is separate from completing OAuth and verifying tool discovery in ChatGPT.

## 3. Restrict who can sign in

The Blueprint sets `ELIX_AUTH0_ALLOWED_SUBJECT_PREFIXES=never-admit|` on purpose: this is a deny-by-default placeholder. You must explicitly allow your own exact Auth0 subject in `ELIX_AUTH0_ALLOWED_SUBJECTS` before your sign-in can work.

The exact subject can be found in **Auth0 → User Management → Users → your verified Google account → User ID** after your first test login. It usually looks like `google-oauth2|123...`. Put the entire value in the Render secret field; do not use a generic `google-oauth2|` prefix when you only want your own account.

## 4. Create a free PostgreSQL database with Neon

1. Sign up at [Neon](https://neon.tech/) on its **Free** plan. Create a project/database named `elix` in a region reasonably close to Render's Ohio region.
2. In the Neon dashboard, copy its **PostgreSQL connection string**. **Treat it as a password.** Do not paste it in chat or commit it to GitHub.
3. Before entering the URL in Render, remove query parameters such as `?sslmode=require` or `&channel_binding=require` if present. Elix explicitly rejects SSL URL parameters; the relay config uses `ELIX_DATABASE_SSL_MODE=verify-full` to enforce certificate-verified TLS. Do not change the username, host, database, or password portions.

## 5. Create the free Render web server

1. In Render, connect GitHub and grant access to the **private** `PraagneySharma/Elix` repository.
2. Select **New → Blueprint**, choose this repository and `main`, and select the latest `render.yaml`.
3. Confirm the preview lists only one service, **elix-relay — Free**, and **no Render PostgreSQL database**. If any paid service appears, stop without applying.
4. Render prompts for values labeled **Sync: false**:
   - `DATABASE_URL`: your private Neon PostgreSQL URL with the SSL query parameters removed.
   - `ELIX_AUTH0_ISSUER`: your Auth0 tenant issuer, ending in `/`.
   - `ELIX_AUTH0_ALLOWED_SUBJECTS`: your exact Auth0 user ID.
   - `ELIX_PANEL_CLIENT_ID`: the Regular Web Application client ID.
   - `ELIX_PANEL_CLIENT_SECRET`: the Regular Web Application client secret.
5. Render generates the panel cookie-signing secret. The free-tier start command runs database migrations before starting the server (pre-deploy commands are not available on Render Free).
6. Review Render's monthly usage/bandwidth limits before applying. Auto deployment is **off**; deploy the relay manually after configuration.

The Neon database connection travels over the network and uses certificate-verified TLS. Render does not create or charge for a managed PostgreSQL database in this configuration.

## 6. DNS

In your Render web service, open **Settings → Custom Domains**. Add or verify `mcp.praagney.com` if not already present. The Render dashboard displays your assigned hostname ending in `.onrender.com`.

In your DNS provider, create:
- Record type: `CNAME`
- Name: `mcp`
- Target: **the actual `.onrender.com` hostname shown by Render**, without `https://`
- If using Cloudflare, set proxy to **DNS only** for the first verification.

Then return to Render and verify the custom domain. Render manages HTTPS certificates. Never guess the CNAME target.

## 7. First tests

Visit `https://mcp.praagney.com/healthz` and confirm the healthy JSON response. If the relay reports a database error, check the Neon connection details and deployment logs without posting passwords.

The CLI can then connect via `ELIX_RELAY_ORIGIN=https://mcp.praagney.com`. Run the CLI from a narrow trusted folder. Redeem its pairing code through `https://mcp.praagney.com/panel`.

Finally, register a custom MCP app in ChatGPT pointed at `https://mcp.praagney.com/mcp`, using OAuth. This app is distinct from any existing installation.

**Security:** `system` access can run operating-system commands as the signed-in local user. Prefer `workspace` access, protect the computer, and never commit cloud secrets or tokens.
