# @praagney/elix

The `elix` CLI connects one project on your computer to the Elix MCP relay through an authenticated outbound worker. It supports Windows, macOS, and Linux and requires Node.js 22.9 or newer. Install the CLI globally from npm:

```shell
npm install --global @praagney/elix
```

Approved beta testers can [connect Elix through custom MCP](https://elix-eight.vercel.app/docs/developer-mode), then run it inside a project. The default relay remains `https://mcp.praagney.com`:

```shell
elix
```

## Access profiles

| Profile | Read files | Edit files inside the project | Run commands |
| --- | --- | --- | --- |
| `read-only` | Yes | No | No |
| `workspace` (default) | Yes | Yes | No |
| `system` | Yes | Yes | Yes |

Use `elix --access read-only` for inspection. Use `elix --access system` only when the task needs local tests, builds, Git, or another project command.

> **`system` is not sandboxed.** Commands inherit the full environment, credentials, filesystem permissions, and network access of the operating-system account that started Elix. They are not confined to the selected root.

Expose only a narrow project you trust. Keep credentials and regulated or sensitive data out of the workspace. Review the [security overview](https://elix-eight.vercel.app/security) before enabling commands.

Pass a directory for another project and `--label <name>` to identify concurrent workers. Interactive mode shows the root, access, connection, and recent activity. Press `q` or Ctrl+C to disconnect.

For scripts and non-interactive terminals, use `elix --headless --access read-only`. Windows: `elix --headless --keep-awake` can also prevent idle sleep until Elix exits.

On first run, redeem the printed pairing code in the Elix control panel from any browser. The CLI stores only its revocable device credential. Later sessions reuse that pairing without user sign-in.

Press `d` to list and revoke devices. Run `elix unpair` to revoke this computer and remove its pairing.

Useful controls:

```shell
elix unpair
elix update --check
```

See the [quickstart](https://elix-eight.vercel.app/docs/quickstart), [Developer Mode guide](https://elix-eight.vercel.app/docs/developer-mode), and [security overview](https://elix-eight.vercel.app/security).
