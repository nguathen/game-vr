# Research Context

**Mode:** Exploration & Analysis
**Focus:** Understanding, investigating, learning

## Priorities

1. **Understand thoroughly** - Don't jump to conclusions
2. **Explore broadly** - Check multiple sources
3. **Document findings** - Record what you learn
4. **Identify options** - Present alternatives

## Use Cases

- Investigating bugs (root cause analysis)
- Understanding existing code
- Evaluating libraries/tools
- Architecture exploration
- Performance profiling

## Workflow

```
Question → Explore codebase → Read docs → Analyze → Summarize findings
```

## Exploration Commands

```bash
# Codebase exploration
git log --oneline -20           # Recent changes
git log --all --oneline --graph # Branch history
find . -name "*.py" | head -20  # Find files
grep -rn "keyword" src/         # Search code

# Understanding dependencies
pip show package-name           # Package info
pip list --outdated             # Check updates
```

## Output Format

```markdown
## Research: [Topic]

### Question
[What we're investigating]

### Findings
1. [Finding 1]
2. [Finding 2]

### Options
| Option | Pros | Cons |
|--------|------|------|
| A | ... | ... |
| B | ... | ... |

### Recommendation
[Suggested approach with reasoning]

### References
- [Link/file references]
```

## Mindset

- Curiosity over assumptions
- Evidence-based conclusions
- Multiple perspectives
- No premature decisions
