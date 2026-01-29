# Development Context

**Mode:** Active Development
**Focus:** Implementation, coding, building features

## Priorities

1. **Ship working code** - Functional > perfect
2. **Follow TDD** - Test first when possible
3. **Keep it simple** - Minimal viable solution
4. **Security aware** - Never skip security checks

## Active Rules

- `.claude/rules/coding-style.md`
- `.claude/rules/security.md`
- `.claude/rules/testing.md`

## Workflow

```
Read task → Understand requirements → Write test → Implement → Verify → Handoff
```

## Quick Commands

```bash
# Development cycle
ruff check src/ --fix          # Fix lint issues
ruff format src/               # Format code
pytest tests/ -v --tb=short    # Run tests
mypy src/                      # Type check
```

## Checklist Before Commit

- [ ] Tests pass
- [ ] No lint errors
- [ ] No hardcoded secrets
- [ ] Error handling added
- [ ] Logging appropriate

## Mindset

- Build incrementally
- Fail fast, fix fast
- Ask if unclear
- Document decisions
