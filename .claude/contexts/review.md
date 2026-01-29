# Review Context

**Mode:** Code Review
**Focus:** Quality, security, architecture compliance

## Priorities

1. **Security first** - Block vulnerabilities
2. **Correctness** - Logic errors, edge cases
3. **Maintainability** - Clean, readable code
4. **Performance** - No obvious bottlenecks

## Active Rules

- `.claude/rules/security.md`
- `.claude/rules/coding-style.md`
- `.claude/rules/performance.md`

## Review Checklist

### Security (CRITICAL)
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevented
- [ ] XSS/CSRF protected
- [ ] Auth/authz checked

### Code Quality
- [ ] Functions <20 lines
- [ ] Clear naming
- [ ] No code duplication
- [ ] Error handling proper
- [ ] Tests included

### Performance
- [ ] No N+1 queries
- [ ] Appropriate algorithms
- [ ] Resources cleaned up

## Output Format

```markdown
## Review: [APPROVED/NEEDS CHANGES]

### Security: [PASS/FAIL]
### Quality: [X/10]
### Issues: [List if any]

**Verdict:** [Ready for merge / Blocked]
```

## Mindset

- Be thorough but constructive
- Explain why, not just what
- Suggest fixes, don't just criticize
- Block only for real issues
