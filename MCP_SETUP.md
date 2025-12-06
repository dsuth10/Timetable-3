# SQLite MCP Server Setup Instructions

The SQLite MCP server has been installed locally and is ready to use with your Timetable-3 database.

## Installation Complete

✅ Repository cloned to: `c:/Users/dsuth/Documents/Code Projects/sqlite-mcp-server`  
✅ Dependencies installed (mcp>=1.14.0)  
✅ Server script ready: `start_sqlite_mcp.py`  
✅ Database path configured: `backend/instance/timetable.db`

## Configure Cursor to Use the MCP Server

To enable the SQLite MCP server in Cursor, you need to add it to Cursor's MCP configuration. The configuration location depends on your Cursor setup:

### Option 1: Cursor Settings (Recommended)

1. Open Cursor Settings (File → Preferences → Settings, or `Ctrl+,`)
2. Search for "MCP" or "Model Context Protocol"
3. Find the MCP servers configuration section
4. Add the following configuration:

```json
{
  "mcpServers": {
    "sqlite-mcp-server": {
      "command": "python",
      "args": [
        "c:/Users/dsuth/Documents/Code Projects/sqlite-mcp-server/start_sqlite_mcp.py",
        "--db-path",
        "c:/Users/dsuth/Documents/Code Projects/Timetable-3/backend/instance/timetable.db"
      ],
      "env": {}
    }
  }
}
```

### Option 2: Configuration File

If Cursor uses a configuration file (check Cursor's documentation), you can use the example file at:
`.cursor/mcp-config-example.json`

Copy that configuration into your Cursor MCP settings.

## Verify Installation

After configuring, restart Cursor and test the MCP server:

1. Ask the AI assistant: "List all tables in the database"
2. The assistant should use the MCP server to query your timetable database
3. You should see responses using the MCP tools

## Available MCP Tools

Once configured, the SQLite MCP server provides 73 tools including:

- **Core Database Operations**: `read_query`, `write_query`, `list_tables`, `describe_table`
- **JSON Helper Tools**: JSON manipulation and querying
- **Text Processing**: Full-text search capabilities
- **Statistical Analysis**: Data analysis tools
- **Schema Operations**: Table creation and management

## Troubleshooting

### Server Not Starting

If the MCP server doesn't start:
1. Verify Python is in your PATH: `python --version`
2. Check the database path is correct
3. Ensure the database file exists: `backend/instance/timetable.db`

### Tools Not Available

If tools aren't showing up:
1. Restart Cursor completely
2. Check Cursor's MCP server status/logs
3. Verify the configuration JSON is valid

### Database Path Issues

If you need to change the database path, update the `--db-path` argument in the configuration.

## Manual Testing

You can test the server manually by running:

```bash
cd "c:/Users/dsuth/Documents/Code Projects/sqlite-mcp-server"
python start_sqlite_mcp.py --db-path "c:/Users/dsuth/Documents/Code Projects/Timetable-3/backend/instance/timetable.db"
```

The server will start and wait for MCP client connections. Press Ctrl+C to stop it.

## Next Steps

1. Add the configuration to Cursor's MCP settings
2. Restart Cursor
3. Test by asking database questions
4. The cursor rule `.cursor/rules/database-mcp-rules.mdc` will ensure the AI uses MCP for database operations

For more information, see: https://github.com/neverinfamous/sqlite-mcp-server/wiki/Quick-Start
