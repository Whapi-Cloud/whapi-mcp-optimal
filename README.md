# whapi-mcp-optimal

A Model Context Protocol (MCP) server for Whapi Cloud (WhatsApp API).  A stripped-down version with only the most basic features.

## Quick start

Requires Node.js 18+.

Install and run via NPX:

```bash
npx -y whapi-mcp-optimal@latest
```

Or set your Whapi API token and run:

```bash
# PowerShell
$env:API_TOKEN="YOUR_TOKEN"; npx -y whapi-mcp-optimal@latest
```

## Using with MCP clients

- Cursor: add to %USERPROFILE%\.cursor\mcp.json
```json
{
  "mcpServers": {
    "whapi-mcp-optimal": {
      "command": "npx",
      "args": ["-y", "whapi-mcp-optimal@latest"],
      "env": { "API_TOKEN": "YOUR_TOKEN" }
    }
  }
}
```

- Claude Desktop: add to %APPDATA%\Claude\claude_desktop_config.json (same structure as above).

## Tools

The server exposes tools generated from Whapi OpenAPI. Example:

- sendMessageText (required: to, body)

Example call (pseudo):

```
name: sendMessageText
arguments: { "to": "1234567890@s.whatsapp.net", "body": "Hello" }
```

## License

MIT