# Technical Debt Tracker

> **Last Updated:** 2026-01-22

---

## Overview

| Type | Count | Impact |
|------|-------|--------|
| Code Debt | 0 | - |
| Design Debt | 0 | - |
| Test Debt | 0 | - |
| Doc Debt | 0 | - |
| Dependency Debt | 0 | - |

**Total Debt Score:** 0/10 (lower is better)

---

## Active Debt Items

_None_

---

## Debt Categories

### Code Debt
Shortcuts in code: copy-paste, magic numbers, complex functions

### Design Debt
Architectural shortcuts: tight coupling, missing abstractions, wrong patterns

### Test Debt
Testing gaps: low coverage, missing edge cases, flaky tests

### Doc Debt
Documentation issues: outdated docs, missing API specs, unclear comments

### Dependency Debt
Package issues: outdated dependencies, security vulnerabilities, deprecated APIs

---

## Debt Item Template

```markdown
### DEBT-XXX: [Title]

**Type:** Code | Design | Test | Doc | Dependency
**Severity:** Low | Medium | High | Critical
**Created:** YYYY-MM-DD
**Reporter:** [Agent/User]

**Location:**
- File: path/to/file.py
- Lines: XX-YY (if applicable)

**Description:**
What shortcut was taken and why.

**Impact:**
- Performance: [None/Low/Medium/High]
- Maintainability: [None/Low/Medium/High]
- Security: [None/Low/Medium/High]

**Suggested Resolution:**
How to properly fix this debt.

**Estimated Effort:** [Small/Medium/Large]

**Related:**
- TASK-XXX (if created from task)
- ISSUE-YYY (if caused issue)
```

---

## Severity Guidelines

| Severity | Criteria | Action |
|----------|----------|--------|
| Critical | Security risk, data integrity | Fix immediately |
| High | Blocks features, major performance | Fix in current sprint |
| Medium | Maintainability concern | Schedule for next sprint |
| Low | Minor inconvenience | Fix when touching area |

---

## Resolved Debt

_None_

---

## Debt Reduction Strategy

1. **Track continuously** - Log debt as it's created
2. **Prioritize by impact** - Fix high-impact debt first
3. **Budget time** - Allocate 20% of sprint to debt reduction
4. **Boy Scout Rule** - Leave code better than you found it
5. **Review regularly** - Assess debt in sprint planning
