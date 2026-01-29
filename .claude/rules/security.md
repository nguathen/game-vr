# Security Rules

## Input Validation
- NEVER trust user input
- Sanitize all inputs at boundaries
- Use parameterized queries (never string concatenation)
- Validate file paths (prevent traversal)

## Secrets Management
- NO hardcoded credentials/API keys
- Use environment variables
- Never log sensitive data
- Error messages must not leak info

## Authentication/Authorization
- Check auth on every endpoint
- Use proper password hashing (bcrypt, argon2)
- Validate JWT tokens properly
- Implement rate limiting

## Subprocess/Commands
- Always use `shell=False`
- Validate command arguments
- Never pass user input directly to shell

## OWASP Top 10 Checklist
1. Broken Access Control - Auth checks everywhere
2. Cryptographic Failures - Proper encryption
3. Injection - Parameterized queries
4. Insecure Design - Threat modeling
5. Security Misconfiguration - Secure defaults
6. Vulnerable Components - Update dependencies
7. Auth Failures - Strong session management
8. Data Integrity - Signed updates
9. Logging Failures - Audit trail
10. SSRF - URL validation/allowlists
