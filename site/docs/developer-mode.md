# Add Elix in Developer Mode

Elix is not yet listed in the public ChatGPT Plugin Directory. This connection is currently limited to **approved beta identities**. The public npm package can be installed independently, but installing it does not grant relay access.

## 1. Enable access to custom MCP servers

Open [ChatGPT](https://chatgpt.com/) in a desktop browser. Depending on which interface is available to your plan or workspace:

- **Current Plugins interface:** Open **Plugins**, select the **+** button, and choose **Add custom MCP server**.
- **Legacy Developer Mode interface:** Open **Settings > Apps > Advanced Settings** and enable Developer Mode (if permitted), then use **Apps > Create**. Business/Enterprise/Edu workspaces may require an admin to enable this first.

If neither option appears, your account or workspace does not currently permit custom MCP apps. The website cannot enable that permission for you. Refer to [OpenAI's custom MCP server documentation](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt).

## 2. Enter Elix's connection details

- **Name:** Elix
- **Server type:** Remote MCP over HTTPS
- **Server URL:**

```text
https://mcp.praagney.com/mcp
```

- **Authentication:** OAuth
- **OAuth client ID (if prompted):** Ask your Elix beta operator for the preconfigured OAuth client ID and setup instructions. **Do not create an Auth0 tenant or change tenant settings.** Those tasks belong to the operator.
- **OAuth scope:** The existing server advertises the migration-compatible scope `veronica:access`. Use what the server requests. The `elix:access` scope is not yet active.
- **Account:** Use only the identity explicitly approved for the Elix beta. The Auth0 sign-in screen may still show Veronica while the hosted login is being rebranded. Stop if you see an unexpected domain or request for permissions.

In the newer Plugins interface, review the risk notice, choose **Create as a plugin**, and inspect the discovered tools. In the legacy Developer Mode interface, use **Scan Tools**, complete OAuth authorization, and then **Create**.

Grant only the permissions you understand. A local worker controls which project is exposed and whether commands can run.

## 3. Install and pair your local worker

Return to the [Quickstart](/docs/quickstart#2-install-the-elix-cli). Install the CLI from npm using `npm install --global @praagney/elix`.

Run Elix inside the project you want to expose, start with read-only access, and enter its pairing code at the [Elix control panel](/panel).

## 4. Confirm the connection

In a new ChatGPT chat, select Elix in the tools/plugins menu or use `@Elix` if supported. Ask it to list connected workspaces. Your local worker must remain online for tools to work.

If **OAuth authorization** or **tool scanning** fails, the MCP app has not connected successfully. An Auth0 error such as **client not authorized to access resource server** means the Elix operator must authorize ChatGPT's OAuth client for this API before you can sign in. The local CLI may be paired and connected to the relay while the ChatGPT plugin is still disconnected. You can usually retry **Continue connecting app** after the operator fixes its grant; do not create duplicate plugins. Contact the person who invited you for assistance. [Support](/support) has more troubleshooting steps.

Custom MCP connections are available only where your ChatGPT account and workspace allow them. This guide does not claim that Elix has been published in the ChatGPT plugin directory.
