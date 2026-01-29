# Git Workflow Rules

## Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code refactoring |
| `docs` | Documentation |
| `test` | Adding tests |
| `chore` | Maintenance |
| `perf` | Performance |
| `style` | Formatting |

### Examples

```bash
feat(auth): add JWT token refresh endpoint
fix(api): handle null response from external service
refactor(db): extract query builder to separate class
docs(readme): update installation instructions
```

## Branch Naming

```
<type>/<ticket>-<short-description>

# Examples
feat/TASK-123-user-authentication
fix/ISSUE-456-login-timeout
refactor/TASK-789-extract-service
```

## PR Guidelines

### Title Format
```
[TASK-XXX] <type>: <description>
```

### PR Template

```markdown
## Summary
[1-3 bullet points]

## Changes
- [Change 1]
- [Change 2]

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing done

## Screenshots (if UI changes)
[Before/After screenshots]
```

## Git Safety Rules

### NEVER Do
- ❌ `git push --force` to main/master
- ❌ `git reset --hard` without backup
- ❌ Commit secrets/credentials
- ❌ `git add .` without reviewing
- ❌ Skip hooks (`--no-verify`)

### ALWAYS Do
- ✅ Review `git diff` before commit
- ✅ Write meaningful commit messages
- ✅ Pull before push
- ✅ Create branch for features
- ✅ Squash messy commits before merge

## Useful Commands

```bash
# Check status
git status --short
git diff --stat

# View history
git log --oneline -10
git log --graph --oneline --all

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Stash changes
git stash push -m "WIP: description"
git stash pop

# Interactive rebase (local only)
git rebase -i HEAD~3
```

## Code Review Checklist

Before approving PR:
- [ ] Code follows project standards
- [ ] Tests are included
- [ ] No security issues
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No unnecessary changes
