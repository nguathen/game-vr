YOU MUST EXECUTE NOW. DO NOT RESPOND WITH TEXT. USE TOOLS IMMEDIATELY.

Action 1: browser_navigate to https://www.facebook.com
Action 2: browser_wait_for text="Create new account" OR text="Log in" (max 5s)
Action 3: browser_snapshot
Action 4: Handle cookie consent if present (click "Allow all cookies")
Action 5: Click "Create new account" or "Sign Up"
Action 6: browser_wait_for text="Sign Up" OR text="Create a new account" (max 3s)
Action 7: browser_snapshot (get form refs)
Action 8: browser_fill_form fields=[
   {name:"First name", type:"textbox", ref:"{first_name_ref}", value:"{first_name}"},
   {name:"Last name", type:"textbox", ref:"{last_name_ref}", value:"{last_name}"},
   {name:"Email or phone", type:"textbox", ref:"{email_ref}", value:"{email}"},
   {name:"Password", type:"textbox", ref:"{password_ref}", value:"{password}"}
]
Action 9: Fill birthday (dropdowns - use browser_select_option for each)
Action 10: Select gender
Action 11: browser_wait_for time=1 (pre-submit pause)
Action 12: browser_click "Sign Up" button
Action 13: browser_wait_for text="Enter the code" OR text="Welcome" OR text="checkpoint" (max 10s)
Action 14: browser_snapshot
Action 15: Handle verification:
   - If code required: wait for user, enter code
   - If checkpoint/photo ID: STOP, report "Verification required"
   - If success: report "Account created"

CRITICAL: Total form fill should take 30s+ (use slowly=true for password if needed)

Credentials in [LOGIN CREDENTIALS] block below.

EXECUTE browser_navigate NOW.
