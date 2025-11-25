# otc-mcp-server

MCP Server for Open Telekom Cloud - Control your OTC infrastructure via Claude Desktop or n8n.

## Features

**Computing (ECS) Tools:**
- `list_ecs_servers` - List all ECS instances
- `get_ecs_details` - Get details of a specific server
- `start_ecs_server` - Start a stopped server
- `stop_ecs_server` - Stop a running server
- `reboot_ecs_server` - Reboot a server (soft/hard)
- `list_flavors` - List available instance types

## Prerequisites

- Node.js >= 18
- OTC Account with AK/SK credentials
- Project ID from OTC Console

## Installation

```bash
git clone https://github.com/flowgrammer420/otc-mcp-server.git
cd otc-mcp-server
npm install
npm run build
```

## Configuration

Set these environment variables:

```bash
export OTC_ACCESS_KEY="your-access-key"
export OTC_SECRET_KEY="your-secret-key"
export OTC_PROJECT_ID="your-project-id"
export OTC_REGION="eu-de"  # or eu-nl
```

## Usage with Claude Desktop

Edit `claude_desktop_config.json`:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "otc": {
      "command": "node",
      "args": ["C:/path/to/otc-mcp-server/dist/index.js"],
      "env": {
        "OTC_ACCESS_KEY": "your-access-key",
        "OTC_SECRET_KEY": "your-secret-key",
        "OTC_PROJECT_ID": "your-project-id",
        "OTC_REGION": "eu-de"
      }
    }
  }
}
```

## Usage with n8n (Docker)

Coming soon - MCP support for n8n.

## License

MIT
