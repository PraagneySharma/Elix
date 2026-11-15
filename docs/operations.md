# Operations guide

## Install

The npm package supports Windows, macOS, and Linux and requires Node.js 22.9 or newer:

```shell
npm install --global @praagney/elix
```

**The npm package is the supported installation method.** The unreleased standalone installers are not published as a stable distribution channel; do not use an unverified install script or download from an unofficial mirror.

## Select a project and access profile

Run Elix from a narrow project directory, not a home directory or filesystem root:

```shell
cd C:\path\to\project
elix
```

The default `workspace` profile permits structured reads and guarded writes inside the selected root, with commands disabled. Use `elix --access read-only` for inspection. Use `elix --access system` only when the task requires local commands.

A `system` command has the full operating-system authority of the account that started Elix and is not confined to the selected root. See [Security and permissions](https://elix-eight.vercel.app/security) for the complete boundary.

The terminal displays the selected root and access profile. Keep it open while using Elix. Press `q` or Ctrl+C to disconnect.

## Keep a Windows workspace awake

`elix --keep-awake` prevents idle sleep during sessions, including between tool calls. It defaults off; quitting or crashes release the request. Displays can turn off.

For closed-lid use, set Windows' plugged-in lid action to **Do nothing**. Use AC power and keep the laptop ventilated. Modern Standby limits battery wake requests; manual sleep still works. [Windows limitations](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-powersetrequest).

## Connect ChatGPT

The hosted Elix connection is currently an invite-only beta, **not yet listed in ChatGPT's Plugin Directory**. If your ChatGPT account supports custom MCP servers, create an OAuth connection with `https://mcp.praagney.com/mcp`. Follow the [Quickstart](https://elix-eight.vercel.app/docs/quickstart) for current Plugins or Developer Mode steps and use an approved Elix identity.

On first launch, redeem the printed pairing code on the control panel from any browser. The CLI stores only a revocable device credential.

Verify discovery with:

```text
Use Elix to list my connected workspaces and report each access profile and permission.
```

The returned profile and permissions should match the local terminal.

## Multiple workspaces

Start one process per project and add non-sensitive labels when clients need to distinguish them:

```shell
elix --label frontend C:\work\frontend
elix --label api C:\work\api
```

Elix does not derive labels from local paths. A duplicate process for the same canonical root exits before login or relay connection.

## Interactive HUD

**Workspace** shows the root, paired computer, access and newest activity. `A` opens **Activity**; `W` or Escape returns. Workspace arrows change access, with confirmation before increases. `D` opens **Devices**; up/down selects and Enter or `R` revokes. `?` opens Help.

## Headless workers

Use `--headless` when an operating-system supervisor runs an unattended worker:

```shell
elix --headless --label recovery C:\path\to\project
```

Headless mode omits the HUD and activity history and prints only the workspace, connection state, and notices to stderr; all workspace options still apply. Running `elix` without `--headless` outside an interactive terminal exits before sign-in or pairing. SIGINT or SIGTERM disconnects. Use `notify` updates or configure the supervisor to restart after successful updates and failures.

## Updates

Elix checks at most daily before connecting. Update notices persist until installed or a check finds no newer release. Version or channel changes clear them; `off` hides them.

```shell
elix update --check
elix update
elix update --policy auto
elix update --policy off
```

Disconnect every running workspace before installing an update.

## Device controls

```shell
elix unpair
```

Press `d` in the interactive HUD to list devices and active workspaces; Enter revokes a selected device. `unpair` revokes this computer and removes its pairing. Disconnect Elix in ChatGPT separately to revoke client authorization.

## Verify a setup

1. Confirm the terminal shows the intended root and profile.
2. Confirm `list_workspaces` reports the same profile and permissions.
3. Read a non-sensitive file from the selected project.
4. Under `read-only`, confirm a write is rejected.
5. Under the default `workspace` profile, confirm a guarded edit succeeds and a command is rejected.
6. Under `system`, run only a bounded, non-destructive project command.
7. Stop the worker and confirm the workspace becomes unavailable.

## Troubleshooting

Common fixes live on the [support page](https://elix-eight.vercel.app/support). Check relay health at `https://mcp.praagney.com/healthz`, and report vulnerabilities through [`SECURITY.md`](../SECURITY.md), not a public issue.
