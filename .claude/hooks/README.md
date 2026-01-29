# Hooks System

## Overview

Hooks are automated actions triggered by tool events. They help enforce quality and catch issues early.

## Available Hooks

| Hook | Trigger | Action |
|------|---------|--------|
| `pre-commit-security` | Before git commit | Scan for secrets |
| `post-edit-lint` | After editing .py files | Run ruff check |
| `post-write-format` | After writing .py files | Run ruff format |
| `warn-console-log` | After editing JS/TS | Warn about console.log |
| `pre-push-tests` | Before git push | Remind to run tests |

## Installation

Copy hooks configuration to your Claude settings:

```bash
# Add to ~/.claude/settings.json
cat .claude/hooks/hooks.json
```

Or merge the hooks array into your existing settings.

## Hook Structure

```json
{
  "name": "hook-name",
  "description": "What it does",
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.py$\"",
  "hooks": [
    {
      "type": "command",
      "command": "your-command-here"
    }
  ]
}
```

## Matcher Syntax

- `tool == "Edit"` - Match tool name
- `tool_input.file_path matches "\\.py$"` - Regex on input
- `&&` - Combine conditions

## Environment Variables

Available in hook commands:
- `$TOOL_INPUT_FILE_PATH` - File being edited/written
- `$TOOL_INPUT_COMMAND` - Command being run (for Bash)

## Custom Hooks

Add your own hooks for:
- Type checking after edits
- Documentation linting
- Dependency auditing
- Custom validation rules
