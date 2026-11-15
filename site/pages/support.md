# Support

Start with the [quickstart](/docs/quickstart). Elix's **source code and issue tracker are public**, while access to the managed relay is still an invite-only beta. Report reproducible, non-sensitive bugs and documentation problems on [GitHub Issues](https://github.com/PraagneySharma/Elix/issues). For beta access or account-specific problems, contact the person who invited you. Never publish credentials, logs containing secrets, personal data, or private project files.

## Common fixes

- **No online workspace:** keep the worker terminal open. If it shows a pairing code, redeem it on the Elix control panel with the intended Elix account; otherwise confirm the stored pairing has not been revoked.
- **Wrong workspace:** stop the worker and restart it in the intended project, optionally with a unique `--label`.
- **Permission error:** restart with broader access only when the task genuinely requires it. Do not try to bypass the selected profile.
- **`restricted_data_blocked`:** remove the credential from the request or reproduce the problem with a non-sensitive placeholder such as `<redacted>`. Do not retry with encoding, another tool, or a shell workaround.
- **Wrong paired account:** stop workers, run `elix unpair`, start `elix` again, and redeem the new pairing code on the control panel with the intended account.
- **Previous relay unavailable:** run `elix unpair` to remove the stale local pairing. If Elix cannot confirm remote revocation, revoke that device from the old relay's control panel if it becomes available again.
- **Tools changed:** if you added Elix as a custom Developer Mode app, run **Scan Tools** again after an Elix update.

Before posting diagnostics, remove source code, local paths, account identifiers, tokens, credentials, and command output.

## Security reports

Submit a [private vulnerability report](https://github.com/PraagneySharma/Elix/security/advisories/new), **not a public issue**. Include the affected version, impact, safe reproduction steps, and a contact method. Do not include secrets or sensitive files. If private reporting is unavailable, file a public issue titled **Security contact request** without vulnerability details.

Read the [security overview](/security) for the current product boundary.

## Account and data requests

Contact your beta invitation contact privately to request account or data deletion. The operator must verify the request before changing account data.

## Disconnect immediately

Press Ctrl+C or `q` in the worker terminal to end workspace access. Run `elix unpair` to revoke this computer's device credential. Disconnect Elix in ChatGPT to revoke the client's authorization.
