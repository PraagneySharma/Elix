# Connect ChatGPT to your project

Elix's CLI is published on npm, but its ChatGPT integration is not yet listed in the public Plugin Directory. The managed relay is an **invite-only beta**. You need an approved Elix identity and a ChatGPT account that permits custom MCP connections; an arbitrary new account cannot yet complete onboarding.

## 1. Add Elix through Developer Mode

<p class="docs-action-row"><a class="primary-action" href="/docs/developer-mode">Set up Elix in Developer Mode</a></p>

First obtain beta approval from the person who invited you. In ChatGPT on the web, open **Plugins**, select **+**, and choose **Add custom MCP server** if available. Name the connection **Elix**, choose **OAuth**, and use this endpoint:

```text
https://mcp.praagney.com/mcp
```

**Important:** The current relay advertises the compatibility OAuth scope `veronica:access`, not `elix:access`. Do not manually substitute a different scope. If ChatGPT asks for an OAuth client ID, obtain the already-configured client details from the Elix beta operator; **you do not need to create an Auth0 tenant or application**. Only sign in when the address and permissions match your beta invitation. See the [detailed connection guide](/docs/developer-mode). Availability depends on ChatGPT account and workspace settings.

## 2. Install the Elix CLI

Requires **Node.js 22.9+**. Open a terminal in any directory and install Elix from npm:

```shell
npm install --global @praagney/elix
```

Confirm the command is available by running `elix --version`. This installs only the local CLI; the ChatGPT plugin and your project files remain separate.

## 3. Pair a local project

Open a **new interactive terminal** in the project folder you want to share and run:

```shell
elix --access read-only --label elix
```

For a non-interactive terminal, script, or service, use `elix --headless --access read-only --label elix`. The interactive interface intentionally requires a TTY. On the first connection the relay may take time to wake up; keep the process open while it establishes the pairing session.

Elix connects to `https://mcp.praagney.com` by default. The CLI displays a time-limited pairing code. Open the [Elix control panel](/panel), sign in with the approved identity, and enter the code. The hosted Auth0 sign-in may still show the previous Veronica branding during migration. If you were not explicitly invited to this beta, do not attempt to pair your device. Keep the worker terminal running while using ChatGPT. **A successful relay connection does not mean the ChatGPT plugin's OAuth connection is complete.** Verify both separately.

`read-only` is the safest way to test the connection. Later, `workspace` allows file edits inside the selected project; `system` also enables unsandboxed OS commands. [Review the security boundaries](/security) before expanding access.

## 4. Use Elix in ChatGPT

In a new chat, choose your newly connected **Elix** plugin/app, or type `@` and select Elix if your interface supports mentions. Try asking: *"Using Elix, list my connected workspaces and their access levels."*

No workspace? Confirm the worker is running and paired. See [Developer Mode setup](/docs/developer-mode) or [Support](/support) for OAuth issues.

ChatGPT account and workspace restrictions still apply.
