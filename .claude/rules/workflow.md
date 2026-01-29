# Workflow Rules

## Agent Coordination Flow

```
/tl (TechLead) → /dev (Developer) → /code-check → /test
      ↑                                    |
      └──────── Escalate issues ───────────┘
```

## Tracking Files

| File | Purpose | Max Lines |
|------|---------|-----------|
| `specs/tasks.md` | Active tasks | <500 |
| `specs/issues.md` | Open issues | <300 |
| `specs/architecture.md` | System design | - |
| `specs/tech-debt.md` | Technical debt | - |

## Task States
- `pending` - Not started
- `in_progress` - Currently working (only ONE at a time)
- `completed` - Done (add completion date)

## Issue Severity
| Level | Criteria | Action |
|-------|----------|--------|
| Critical | Security/data loss | Block, immediate fix |
| High | Broken functionality | Block, fix required |
| Medium | Code smell, minor bug | Should fix |
| Low | Style issue | Optional |

## Archive Rules
- Tasks: Move completed to `specs/tasks-archive.md` after 7 days
- Issues: Move resolved to `specs/issues-archive.md` when >10

## Mandatory Context Loading
All agents MUST read before starting:
1. `CLAUDE.md` - Project rules
2. `specs/architecture.md` - System design
3. `specs/tasks.md` or `specs/issues.md` - Work items
