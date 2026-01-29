# MCP Usage Rules

## MySQL MCP Server

**Config Location:** `.mcp.json` → `mcpServers.mysql.env`
**DO NOT ask user for credentials!**

```python
# Connect
mcp__mysql__mysql_connect(host, user, password, database)

# Query
mcp__mysql__mysql_query("SELECT * FROM table")
mcp__mysql__mysql_list_tables()
mcp__mysql__mysql_describe_table("table_name")

# Always disconnect when done
mcp__mysql__mysql_disconnect()
```

**Use cases:**
- Verify data after implementation
- Test database queries
- Check schema before writing queries
- Debug data issues

## Playwright MCP Server

```python
# Navigate
mcp__playwright__browser_navigate(url="http://localhost:5000")

# Get page structure (find elements)
mcp__playwright__browser_snapshot()

# Interact (use ref from snapshot)
mcp__playwright__browser_click(element="Button", ref="button[0]")
mcp__playwright__browser_type(element="Input", ref="input[0]", text="value")

# Verify
mcp__playwright__browser_take_screenshot()
mcp__playwright__browser_console_messages()
```

**Use cases:**
- Test UI changes
- Verify frontend implementation
- Automate browser tasks
- Debug UI issues
