---
description: "Cancel active ship loop"
allowed-tools: ["Bash(test -f $HOME/.claude/ship-loop.local.md:*)", "Bash(rm $HOME/.claude/ship-loop.local.md)", "Read($HOME/.claude/ship-loop.local.md)", "Bash(git worktree list)", "Bash(git worktree remove:*)"]
---

# Cancel Ship

To cancel the ship loop:

1. Check if `$HOME/.claude/ship-loop.local.md` exists using Bash: `test -f "$HOME/.claude/ship-loop.local.md" && echo "EXISTS" || echo "NOT_FOUND"`

2. **If NOT_FOUND**: Say "No active ship loop found."

3. **If EXISTS**:
   - Read `$HOME/.claude/ship-loop.local.md` to get the current iteration number from the `iteration:` field
   - Remove the file using Bash: `rm "$HOME/.claude/ship-loop.local.md"`
   - Check for ship worktrees: run `git worktree list` and look for worktrees under `.claude/worktrees/`
   - If ship worktrees exist, offer to remove them with `git worktree remove <path>`
   - Report: "Cancelled ship loop (was at iteration N)" where N is the iteration value
