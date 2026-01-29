# Multi-Agent Workflow (Master Level)

> **Last Updated:** 2025-01-08
> **Parent:** `CLAUDE.md` → Agent Mode section links here.
> **Authority:** Definitive source for agent coordination flow.

---

## Agent Team Overview

### Core Agents (Development Flow)

| Agent | Command | Role | Experience Level |
|-------|---------|------|------------------|
| TechLead | `/tl` | Senior Technical Lead - Architecture, planning, risk management | 15+ years |
| Developer | `/dev` | Senior Software Engineer - Clean code, patterns, TDD | 10+ years |
| Code Review | `/code-check` | Principal Engineer - Security, quality, compliance | 12+ years |
| Tester | `/test` | Senior QA Engineer - Test strategy, automation | 10+ years |
| DevOps | `/ops` | Senior DevOps Engineer - CI/CD, infrastructure | 10+ years |
| Status | `/st` | Project Manager - Health reports, recommendations | 8+ years |

### Specialist Agents (On-Demand)

| Agent | Command | Role | When to Use |
|-------|---------|------|-------------|
| Documentation | `/doc` | Technical Writer - API docs, guides, README | After feature complete |
| Security | `/sec` | Security Engineer - OWASP, CVE scan, penetration test | Before release |
| Performance | `/perf` | Performance Engineer - Profiling, optimization | Performance issues |
| Refactoring | `/refactor` | Software Architect - Code cleanup, patterns | Technical debt sprint |
| **Debug** | `/debug` | **Troubleshooter - Error analysis, crash investigation** | **Khi có lỗi/crash** |

---

## Core Principles

```
┌─────────────────────────────────────────────────────────────┐
│                    MASTER LEVEL STANDARDS                    │
├─────────────────────────────────────────────────────────────┤
│  1. Security First    - OWASP Top 10, input validation      │
│  2. Quality Gates     - No shortcuts, proper reviews        │
│  3. Test Coverage     - 80%+ unit, key integration paths    │
│  4. Documentation     - ADRs, API specs, runbooks           │
│  5. Technical Debt    - Track, prioritize, reduce           │
│  6. Continuous Flow   - Escalate → Fix → Verify → Continue  │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Workflow Diagram

```
                         ┌─────────────────┐
                         │  User Request   │
                         └────────┬────────┘
                                  ↓
         ┌────────────────────────────────────────────────┐
         │              /tl (TechLead)                    │
         │  ┌──────────────────────────────────────────┐  │
         │  │ • Analyze requirements                   │  │
         │  │ • Risk assessment                        │  │
         │  │ • Architecture design (ADRs)             │  │
         │  │ • Task breakdown with acceptance criteria│  │
         │  │ • Update specs/tasks.md                  │  │
         │  └──────────────────────────────────────────┘  │
         └────────────────────────┬───────────────────────┘
                                  ↓
         ┌────────────────────────────────────────────────┐
         │              /dev (Developer)                  │
         │  ┌──────────────────────────────────────────┐  │
         │  │ • Check escalated issues first           │  │
         │  │ • TDD: Write test → Implement → Refactor │  │
         │  │ • SOLID principles                       │  │
         │  │ • Security checklist                     │  │
         │  │ • Update task status                     │  │
         │  └──────────────────────────────────────────┘  │
         └────────────────────────┬───────────────────────┘
                                  ↓
         ┌────────────────────────────────────────────────┐
         │           /code-check (Review)                 │
         │  ┌──────────────────────────────────────────┐  │
         │  │ • OWASP Top 10 security scan             │  │
         │  │ • Code quality metrics                   │  │
         │  │ • Performance analysis                   │  │
         │  │ • Architecture compliance                │  │
         │  │ • Technical debt assessment              │  │
         │  └──────────────────────────────────────────┘  │
         └────────────────────────┬───────────────────────┘
                                  ↓
                    ┌─────────────┴─────────────┐
                    ↓                           ↓
            [APPROVED ✓]                 [NEEDS CHANGES ✗]
                    ↓                           ↓
                    │                    Log specs/issues.md
                    │                           ↓
                    │                    Assign to /dev or /tl
                    │                           ↓
                    │                    ┌──────┴──────┐
                    │                    ↓             ↓
                    │               [Code Bug]   [Design Flaw]
                    │                    ↓             ↓
                    │                  /dev          /tl
                    │                    ↓             ↓
                    │                    └──────┬──────┘
                    │                           ↓
                    │                    Re-run /code-check
                    ↓
         ┌────────────────────────────────────────────────┐
         │              /test (Tester)                    │
         │  ┌──────────────────────────────────────────┐  │
         │  │ • Test pyramid strategy                  │  │
         │  │ • Unit tests (80%+ coverage)             │  │
         │  │ • Integration tests (key paths)          │  │
         │  │ • Security tests                         │  │
         │  │ • Edge case coverage                     │  │
         │  └──────────────────────────────────────────┘  │
         └────────────────────────┬───────────────────────┘
                                  ↓
                    ┌─────────────┴─────────────┐
                    ↓                           ↓
            [ALL PASS ✓]                 [FAILURES ✗]
                    ↓                           ↓
                    │                    Log specs/issues.md
                    │                           ↓
                    │                    Analyze root cause
                    │                           ↓
                    │                    ┌──────┴──────┐
                    │                    ↓             ↓
                    │               [Logic Bug]  [Design Issue]
                    │                    ↓             ↓
                    │                  /dev          /tl
                    │                    ↓             ↓
                    │                    └──────┬──────┘
                    │                           ↓
                    │                    Re-run /test
                    ↓
            ┌───────────────┐
            │   COMPLETE    │
            │ Ready for /ops│
            └───────────────┘
```

---

## Escalation Matrix

| Issue Type | Severity | Primary | Escalate To | Response Time |
|------------|----------|---------|-------------|---------------|
| Security vulnerability | Critical | /dev | + /tl | Immediate |
| Logic bug | High | /dev | - | Same day |
| Design flaw | High | /tl | /dev after fix | Same day |
| Performance issue | Medium | /dev | /tl if architectural | 1-2 days |
| Code smell | Low | /dev | - | When convenient |
| Test failure | High | /dev | /tl if design issue | Same day |
| Missing coverage | Medium | /dev | - | 1-2 days |

---

## Quality Gates

### Gate 1: Task Ready (Before /dev)
- [ ] Requirements clear and unambiguous
- [ ] Acceptance criteria defined
- [ ] Architecture supports the change
- [ ] Dependencies identified
- [ ] Risk assessment complete

### Gate 2: Code Complete (Before /code-check)
- [ ] Implementation matches requirements
- [ ] Unit tests written (TDD)
- [ ] Security checklist passed
- [ ] No hardcoded secrets
- [ ] Error handling complete
- [ ] Logging appropriate

### Gate 3: Review Passed (Before /test)
- [ ] Security scan passed (OWASP)
- [ ] Code quality score ≥7/10
- [ ] No critical/high issues
- [ ] Architecture compliance verified
- [ ] Technical debt documented

### Gate 4: Tests Passed (Before /ops)
- [ ] All tests passing
- [ ] Coverage ≥80%
- [ ] Edge cases covered
- [ ] Performance acceptable
- [ ] No regressions

---

## Quick Commands Reference

### New Feature Development
```bash
/tl        # 1. Plan: architecture, tasks, risks
/dev       # 2. Implement: TDD, SOLID, security
/code-check # 3. Review: security, quality, compliance
/test      # 4. Verify: tests, coverage, edge cases
/doc       # 5. Document: API docs, README update
/ops       # 6. Deploy: CI/CD, infrastructure
/st        # 7. Status: health report
```

### Issue Resolution
```bash
/st        # Check current status and blockers
/dev       # Fix escalated issues
/code-check # or /test  # Re-verify fix
```

### Project Health Check
```bash
/st        # Full status report with recommendations
```

### Specialist Agent Usage

```bash
# Security Audit (before release)
/sec       # Run security scan, CVE check, OWASP analysis

# Performance Issues
/perf      # Profile, identify bottlenecks, optimize

# Technical Debt Sprint
/refactor  # Code cleanup, pattern application

# Documentation Sprint
/doc       # Update all docs, API spec, README
```

### Error/Crash Handling (IMPORTANT!)

```bash
# Khi có lỗi hoặc crash:
/debug     # 1. Investigate, reproduce, find root cause
           #    - Check logs
           #    - Use MySQL MCP to check database
           #    - Use Playwright MCP to check UI
           #    - Create issue report

/dev       # 2. Fix the bug (after /debug identifies cause)

/test      # 3. Verify fix works
```

**Error Handling Flow:**
```
Error xảy ra
     ↓
  /debug (Investigate)
     │
     ├── Check logs
     ├── Use MCP tools (MySQL, Playwright)
     ├── Reproduce error
     ├── Find root cause
     └── Create ISSUE in specs/issues.md
            ↓
      /dev (Fix)
            ↓
      /test (Verify)
            ↓
        Done
```

---

## File System

| File | Purpose | Updated By |
|------|---------|------------|
| `specs/tasks.md` | Task tracking | /tl, /dev |
| `specs/issues.md` | Issue tracking | /code-check, /test, /dev, /sec |
| `specs/tech-debt.md` | Technical debt | /code-check, /tl, /refactor |
| `specs/architecture.md` | System design, ADRs | /tl, /dev |
| `specs/standards.md` | Coding standards | /tl |
| `specs/api-spec.md` | API documentation | /tl, /dev, /doc |
| `docs/deployment.md` | Deployment procedures | /ops |
| `docs/runbook.md` | Operational runbooks | /ops |
| `README.md` | Project overview | /doc |
| `CHANGELOG.md` | Version history | /doc, /ops |
| `docs/security-report.md` | Security audit results | /sec |
| `docs/performance-report.md` | Performance analysis | /perf |

---

## Rules for Master Level

### Mandatory
1. **Security is non-negotiable** - OWASP scan before approval
2. **No shortcuts** - Every gate must pass
3. **Document everything** - ADRs, issues, debt
4. **Escalate properly** - Log → Assign → Track → Verify
5. **Test thoroughly** - 80%+ coverage, edge cases

### Best Practices
1. **Think before coding** - Design first, implement second
2. **Small commits** - Atomic, focused changes
3. **Review your own code** - Self-review before /code-check
4. **Fix root causes** - Not just symptoms
5. **Leave it better** - Boy Scout Rule

---

## Health Score Target

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Task Completion | >90% | 70-90% | <70% |
| Open Issues | <3 | 3-5 | >5 |
| Critical Bugs | 0 | 1 | >1 |
| Test Coverage | >80% | 60-80% | <60% |
| Tech Debt Score | <3 | 3-5 | >5 |
| Health Score | >8/10 | 6-8/10 | <6/10 |

---

## Emergency Procedures

### Critical Security Issue
```
1. /tl       - Assess impact and containment
2. /dev      - Hotfix with minimal change
3. /code-check - Security-focused review only
4. /test     - Security test + regression
5. /ops      - Emergency deployment
```

### Production Incident
```
1. /st       - Assess current state
2. /ops      - Rollback if needed
3. /tl       - Root cause analysis
4. /dev      - Fix implementation
5. Normal flow for verification
```
