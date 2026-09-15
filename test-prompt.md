# Test prompt for /allow

Paste the prompt below into opencode to exercise every permission gate
(read, bash, edit). Use it in two runs to verify `/allow`:

1. **With `/allow` disabled** (indicator dimmed): every step below must stop
   with a permission prompt. Approve each one with `once`.
2. **With `/allow` enabled** (indicator bright): run the prompt again — all
   steps must execute with **zero permission prompts**.

The commands and file names use throwaway names (fresh prefixes) so previously
saved "always" approvals from earlier sessions cannot silently auto-approve
them.

---

## Prompt

```
Run these steps one by one, in order, and report the result of each step
clearly labeled STEP 1..4. Do not skip or combine steps.

STEP 1 (read permission): read the file .gitignore in the project root and
quote its full contents.

STEP 2 (bash permission): run exactly this command: whoami /priv | findstr /i "prompt"

STEP 3 (bash permission): run exactly this command: cmd /c "echo allow-test-%RANDOM% > %TEMP%\allow-probe.txt && type %TEMP%\allow-probe.txt"

STEP 4 (edit permission): create a file named allow-probe-check.txt in the
project root containing exactly one line: allow probe <current timestamp>.

Finish by summarizing: which steps required permission prompts and which did
not.
```

---

## What the results mean

| `/allow` state | Expected result |
| --- | --- |
| dimmed (off) | Prompts for STEP 2-4 (STEP 1 read is configured always-allow, so it never prompts) |
| bright (on) | No prompts at all; every step runs |

If STEP 1-4 run without prompts while the indicator is **dimmed**, something
else is auto-approving (built-in auto-approve mode still on, or saved
"always" approvals) — that is the failure case this prompt is designed to
expose.
