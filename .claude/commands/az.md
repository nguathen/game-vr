YOU MUST EXECUTE NOW. DO NOT RESPOND WITH TEXT. USE TOOLS IMMEDIATELY.

Action 1: browser_navigate to https://azure.microsoft.com/en-us/free/
Action 2: browser_wait_for text="Start free" OR text="Sign in" (max 5s)
Action 3: browser_snapshot
Action 4: Click "Start free" or sign in link
Action 5: browser_wait_for text="Sign in" OR text="Create account" (max 3s)
Action 6: browser_snapshot
Action 7: If login required:
   - browser_type ref="{email_ref}" text="{email}"
   - browser_click "Next"
   - browser_wait_for text="Password" (max 3s)
   - browser_snapshot
   - browser_type ref="{password_ref}" text="{password}"
   - browser_click "Sign in"
Action 8: If 2FA prompt:
   - Use TOTP (see LOGIN RULES in CLAUDE.md)
   - Enter code, click verify
Action 9: browser_wait_for text="Azure" OR text="portal" OR text="subscription" (max 10s)
Action 10: browser_snapshot (verify final state)
Action 11: Complete signup form if shown (terms, profile, phone, payment)
Action 12: Report: Logged in [YES/NO], Portal access [YES/NO], Subscription ID if visible

Credentials in [LOGIN CREDENTIALS] block below.

EXECUTE browser_navigate NOW.
