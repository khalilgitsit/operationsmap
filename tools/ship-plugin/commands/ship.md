---
description: "Autonomous implement → verify → review → ship flow"
argument-hint: "DESCRIPTION [--no-worktree] [--no-review] [--tdd] [--max-iterations N]"
allowed-tools: ["Bash(~/.claude/plugins/ship/scripts/setup-ship.sh:*)", "EnterWorktree", "Agent"]
---

# Ship Command

Execute the setup script to initialize the ship loop:

```!
"$HOME/.claude/plugins/ship/scripts/setup-ship.sh" $ARGUMENTS
```

Begin with Step 1: read the relevant files and explain your plan in 3 bullets max. Do NOT write any code until you've outlined your approach and received approval.

CRITICAL RULES:
1. If a completion promise is set, you may ONLY output it when the statement is completely and unequivocally TRUE. Do not output false promises to escape the loop.
2. The Reviewer subagent MUST only use `gh` CLI commands. It must NOT read or modify local files. Pass this constraint clearly in the Agent prompt.
3. The promise token is a machine identifier — output it exactly as-is inside `<promise>` tags. Do not paraphrase or modify it.
