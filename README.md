# Elix

**Work with projects on your computer from ChatGPT.** Elix connects a folder you choose to ChatGPT through a small local worker and an OAuth-protected MCP relay. You can inspect files, edit code, or (only when explicitly enabled) run your local development tools. If another coding tool has reached its usage limit, Elix can let you continue using ChatGPT within your ChatGPT plan's availability and limits. It does not provide unlimited usage or an additional AI model.

[Website](https://elix-eight.vercel.app) · [Quickstart](https://elix-eight.vercel.app/docs/quickstart) · [Security](https://elix-eight.vercel.app/security) · [npm package](https://www.npmjs.com/package/@praagney/elix)

## Start in four steps

**Requirements:** Windows, macOS, or Linux; Node.js **22.9+**; a ChatGPT account that supports custom MCP connections; and an **approved Elix beta identity**. The CLI is public, but hosted relay access is currently invite-only. The ChatGPT plugin is **not** listed in the public Plugin Directory.

### 1. Install Elix

```shell
npm install --global @praagney/elix
elix --version
```

### 2. Connect Elix to ChatGPT

In ChatGPT, open **Plugins → + → Add custom MCP server** if this option is available on your account. Create a connection called **Elix** with **OAuth** and this server address:

```text
https://mcp.praagney.com/mcp
```

Sign in with your approved beta account and accept only the permissions you recognize. If your ChatGPT interface uses a different setup flow, follow the [Developer Mode guide](https://elix-eight.vercel.app/docs/developer-mode). Do not create your own Auth0 application to use the hosted beta.

### 3. Start a worker in your project folder

Open a terminal in the folder you want to expose:

```shell
cd path/to/your-project
elix --access read-only --label my-project
```

Elix displays a pairing code the first time you use a computer. Enter it at the [Elix pairing page](https://mcp.praagney.com/panel/pair) and confirm the device. Keep the terminal running; closing it takes the workspace offline.

For terminals without an interactive screen (automation/SSH/services), add `--headless`. You can use `elix` alone once you're comfortable with the default access level.

### 4. Verify access from ChatGPT

Open a chat with Elix available, and ask:

> Using Elix, list my connected workspaces and their access levels. Read the README in my-project.

The local worker being connected to the relay is **not** proof that the ChatGPT OAuth connection succeeded; check both. Start with non-sensitive test files.

## Choose what ChatGPT may do

| Access | Read and search files | Create, edit, or delete project files | Run local commands |
| --- | :---: | :---: | :---: |
| `read-only` | Yes | No | No |
| `workspace` **(default if omitted)** | Yes | Yes | No |
| `system` | Yes | Yes | Yes |

**Security:** `system` executes commands as your operating-system account. It is **not sandboxed or restricted to the project directory** and can access that account's files, environment, credentials, and network. Use `read-only` for initial testing; grant broader access only when needed. Even structured file tools are not a substitute for choosing a folder free of private credentials. The relay does not keep a durable copy of your repository.

The terminal's Workspace view lets you change access, with confirmation before increasing it. See the [security overview](https://elix-eight.vercel.app/security) and [technical threat model](docs/security.md).

## Useful commands

```shell
elix --help
elix --access workspace --label backend
elix --headless --access read-only
elix update --check
elix unpair
```

In the interactive terminal, press `A` for activity, `W` for workspace, `D` for devices, or `Q` / Ctrl+C to disconnect. To revoke a device remotely, use the [control panel](https://mcp.praagney.com/panel).

## Repository structure

```text
apps/relay/         OAuth-protected MCP server, pairing panel, and database migrations
packages/cli/       npm CLI and local worker
packages/protocol/  Shared tool contracts and validation
site/               Public website and documentation
plugin/             ChatGPT plugin manifests and assets
scripts/            Build, smoke-test, and integration tools
review/             Synthetic local review/test fixture (no production data)
docs/               Architecture, security, deployment, and maintainer guides
```

The two `legacy-render-*-compat` package folders are **temporary, required compatibility wrappers** for the existing Render service's legacy npm build commands. They do not contain the old Veronica application.

## Develop locally

```shell
git clone https://github.com/PraagneySharma/Elix.git
cd Elix
npm ci
npm run build
npm test
npm run site:check
```

For a local relay and disposable database, see [local integration testing](docs/integration-tests.md) and [self-hosting](docs/self-hosting.md). Docker is needed for the full integration test, but not for installing the CLI. The local development OAuth issuer is **for testing only**.

This repository does not include production credentials. Never commit `.env`, pairing credentials, browser state, database dumps, or local workspace content.

## Documentation and support

- [Quickstart](https://elix-eight.vercel.app/docs/quickstart) and [custom MCP connection guide](https://elix-eight.vercel.app/docs/developer-mode)
- [Common issues and beta support](https://elix-eight.vercel.app/support)
- [Security policy / private vulnerability reporting](SECURITY.md)
- [Architecture](docs/architecture.md), [operations](docs/operations.md), and [self-hosting](docs/self-hosting.md)
- [Privacy](https://elix-eight.vercel.app/privacy) and [Terms](https://elix-eight.vercel.app/terms)

**License:** [MIT](LICENSE). The source repository is public; the managed service is still an invitation-only beta.
