# Coding Style Rules

## SOLID Principles
- **S**ingle Responsibility - One class/function = one job
- **O**pen/Closed - Extend without modification
- **L**iskov Substitution - Subtypes replace base types
- **I**nterface Segregation - Small, focused interfaces
- **D**ependency Inversion - Depend on abstractions

## Naming Conventions
- Classes: `PascalCase` (nouns)
- Functions: `snake_case` (verbs)
- Constants: `UPPER_SNAKE_CASE`
- Private: `_leading_underscore`

## Function Rules
- Max 20 lines (prefer <10)
- Max 3 parameters (use objects for more)
- No side effects when possible

## Error Handling
- Use specific exceptions with context
- Never bare `except:` or swallow errors
- Log with structured data

## Code Smells to Avoid
| Smell | Fix |
|-------|-----|
| Long method (>20 lines) | Extract Method |
| Large class (>200 lines) | Extract Class |
| Duplicate code | Extract Method/Class |
| Long parameter list | Parameter Object |
| Magic numbers | Named constants |

## Comments
- Code should be self-documenting
- Comment "why", not "what"
- Use docstrings for public APIs
