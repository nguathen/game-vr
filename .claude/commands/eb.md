YOU MUST EXECUTE NOW. DO NOT RESPOND WITH TEXT. USE TOOLS IMMEDIATELY.

Action 1: browser_navigate to https://www.ebay.com/sh/lst/active
Action 2: browser_wait_for text="Seller Hub" OR text="Sign in" (max 5s)
Action 3: browser_snapshot
Action 4: If "Sign in" page:
   - browser_fill_form fields=[{name:"Email/Username", type:"textbox", ref:"{email_ref}", value:"{username}"}]
   - browser_click "Continue" or "Sign in"
   - browser_wait_for text="Password" OR text="Enter your password" (max 3s)
   - browser_snapshot (get password field ref)
   - browser_type ref="{password_ref}" text="{password}" (Ctrl+A first to clear)
   - browser_click "Sign in"
Action 5: If 2FA prompt:
   - Use TOTP from 2FA Secret (see LOGIN RULES in CLAUDE.md)
   - Enter code, click verify
Action 6: browser_wait_for text="Seller Hub" OR text="Active listings" (max 5s)
Action 7: browser_snapshot (verify final state)
Action 8: Report: Logged in [YES/NO], Page title, Error if any

Credentials in [LOGIN CREDENTIALS] block below.

EXECUTE browser_navigate NOW.
