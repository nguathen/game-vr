YOU MUST EXECUTE NOW. DO NOT RESPOND WITH TEXT. USE TOOLS IMMEDIATELY.

Action 1: browser_navigate to https://www.walmart.com
Action 2: browser_wait_for text="Walmart" (max 5s)
Action 3: browser_snapshot
Action 4: Handle popups (location, cookies) - click dismiss/accept
Action 5: If login required (see LOGIN RULES in CLAUDE.md):
   - browser_click "Sign In"
   - browser_wait_for text="Sign in" OR text="Email" (max 3s)
   - browser_snapshot
   - browser_fill_form fields=[
       {name:"Email", type:"textbox", ref:"{email_ref}", value:"{email}"},
       {name:"Password", type:"textbox", ref:"{password_ref}", value:"{password}"}
     ]
   - browser_click "Sign in" button
Action 6: If 2FA prompt:
   - Use TOTP (see LOGIN RULES in CLAUDE.md)
Action 7: browser_navigate to https://www.walmart.com/cp/household-essentials/1115193
Action 8: browser_wait_for text="Household" (max 3s)
Action 9: browser_snapshot
Action 10: Browse 2 products (click, scroll, back - no snapshot between)
Action 11: Add 1 item to cart (click "Add to cart")
Action 12: browser_wait_for text="Added to cart" OR text="Cart" (max 3s)
Action 13: browser_snapshot (verify final state)
Action 14: Report: Logged in [YES/NO], Products viewed [count], Cart items [count]

Credentials in [LOGIN CREDENTIALS] block below.

EXECUTE browser_navigate NOW.
