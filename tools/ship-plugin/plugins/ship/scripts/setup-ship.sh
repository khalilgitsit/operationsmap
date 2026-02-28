#!/bin/bash

# Ship Loop Setup Script (v2)
# Creates state file with the ship workflow baked in
# Supports worktree isolation, reviewer subagent, and TDD mode

set -euo pipefail

# Parse arguments
TASK_PARTS=()
MAX_ITERATIONS=20
NO_WORKTREE=false
NO_REVIEW=false
USE_TDD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      cat << 'HELP_EOF'
Ship v2 - Autonomous implement → verify → review → ship workflow

USAGE:
  /ship DESCRIPTION OF WHAT TO BUILD [OPTIONS]

ARGUMENTS:
  DESCRIPTION    What you want implemented (can be multiple words)

OPTIONS:
  --max-iterations <n>  Maximum loop iterations (default: 20)
  --no-worktree         Use branch isolation instead of worktree
  --no-review           Skip the reviewer subagent step
  --tdd                 Enable TDD mode (write failing test first)
  -h, --help            Show this help message

DESCRIPTION:
  Starts an autonomous loop that:
    1. Plans the approach (3 bullets, waits for approval)
    2. Creates worktree isolation (or branch with --no-worktree)
    3. Implements the changes (TDD if --tdd)
    4. Verifies build + tests (retries up to 5 times)
    5. Commits, pushes, opens a PR
    6. Reviews via subagent (posts PR comment, loops back if issues)
    7. Stops when PR is open, build is green, and review passes

EXAMPLES:
  /ship add user authentication
  /ship fix the broken search --no-review
  /ship implement dark mode --tdd
  /ship refactor auth module --no-worktree --max-iterations 30

STOPPING:
  /cancel-ship
HELP_EOF
      exit 0
      ;;
    --max-iterations)
      if [[ -z "${2:-}" ]] || [[ ! "$2" =~ ^[0-9]+$ ]]; then
        echo "Error: --max-iterations requires a positive integer" >&2
        exit 1
      fi
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --no-worktree)
      NO_WORKTREE=true
      shift
      ;;
    --no-review)
      NO_REVIEW=true
      shift
      ;;
    --tdd)
      USE_TDD=true
      shift
      ;;
    *)
      TASK_PARTS+=("$1")
      shift
      ;;
  esac
done

TASK="${TASK_PARTS[*]:-}"

if [[ -z "$TASK" ]]; then
  echo "Error: No task description provided" >&2
  echo "" >&2
  echo "   Usage: /ship DESCRIPTION OF WHAT TO BUILD" >&2
  echo "" >&2
  echo "   Examples:" >&2
  echo "     /ship add user authentication" >&2
  echo "     /ship fix the broken search on the dashboard" >&2
  echo "" >&2
  echo "   For all options: /ship --help" >&2
  exit 1
fi

COMPLETION_PROMISE="SHIP_COMPLETE"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# State file lives at absolute path — survives worktree cwd changes
STATE_FILE="$HOME/.claude/ship-loop.local.md"

# Check for existing loop
if [[ -f "$STATE_FILE" ]]; then
  echo "Error: A ship loop is already active. Run /cancel-ship first." >&2
  exit 1
fi

# Build conditional workflow sections
if [[ "$NO_WORKTREE" = true ]]; then
  STEP2_CONTENT="- Create a feature branch from main: \`git checkout -b feat/<short-name>\`"
else
  STEP2_CONTENT="- Use the \`EnterWorktree\` tool to create an isolated worktree workspace
- This gives you a clean copy of the repo without affecting the main working directory"
fi

if [[ "$USE_TDD" = true ]]; then
  STEP3_CONTENT="- **TDD Mode**: Write a failing test FIRST that captures the expected behavior
- Run the test to confirm it fails for the right reason
- Implement the minimum code to make the test pass
- Refactor if needed while keeping tests green
- Keep changes focused — only what's needed for the task"
else
  STEP3_CONTENT="- Write the code changes
- Write or update tests if applicable
- Keep changes focused — only what's needed for the task"
fi

if [[ "$NO_REVIEW" = true ]]; then
  STEP6_CONTENT="### Step 6: REVIEW (skipped — --no-review)
- Review step is disabled. Proceed directly to Step 7."
  STEP6_DONE_GATE="review is skipped"
else
  STEP6_CONTENT='### Step 6: REVIEW
- Launch a subagent (using the `Agent` tool, subagent_type "general-purpose") as the Reviewer with these instructions:
  - You are reviewing PR #N (use the PR number from Step 5)
  - You MUST ONLY use `gh` CLI commands via Bash. Do NOT read or modify local files.
  - Run `gh pr diff <N>` to get the changes
  - Run `gh pr view <N>` to get context
  - Review for: logic errors, missing error handling, security issues, deviation from task requirements, architectural concerns
  - Do NOT flag: style nitpicks, naming preferences, missing comments, things a linter would catch
  - If issues found: run `gh pr comment <N> --body "<findings>"` with this format:
    ```
    ### Ship Review — Cycle N
    Found M issues:
    1. category/severity file:line — Description -> Suggested action
    2. ...
    ```
  - If no issues: post "### Ship Review\n\nNo issues found. LGTM."
  - Return either "APPROVED" or "CHANGES_REQUESTED: <summary>"
- After review response:
  - If APPROVED: proceed to Step 7
  - If CHANGES_REQUESTED: go back to Step 3 to address findings, then re-verify (Step 4) and push (Step 5)
  - Maximum 3 review rounds total — after 3 rounds, report remaining issues and proceed to Step 7 anyway
- Track review round count mentally from conversation context (no frontmatter counter needed)'
  STEP6_DONE_GATE="review passes (or max review rounds reached)"
fi

# Create state file
mkdir -p "$HOME/.claude"

cat > "$STATE_FILE" <<STATEEOF
---
active: true
iteration: 1
max_iterations: $MAX_ITERATIONS
completion_promise: "$COMPLETION_PROMISE"
repo_root: "$REPO_ROOT"
no_worktree: $NO_WORKTREE
no_review: $NO_REVIEW
use_tdd: $USE_TDD
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---

## Task
$TASK

## Workflow — follow these steps in order

### Step 1: PLAN (do this FIRST, before any code)
- Read the relevant source files to understand the current state
- Explain your approach in 3 bullets max
- Identify which files you'll change and why
- Wait for approval before proceeding

### Step 2: WORKTREE / BRANCH
$STEP2_CONTENT

### Step 3: IMPLEMENT
$STEP3_CONTENT

### Step 4: VERIFY (inner retry loop — max 5 fix attempts)
- Run the build and type checking
- Run tests if they exist
- If anything fails: read the errors, fix them, and re-verify
- Maximum 5 fix attempts per verify cycle
- Do NOT proceed until the build is fully green
- If still failing after 5 attempts: report the errors and STOP (do not proceed)

### Step 5: PUBLISH
- Stage and commit with a conventional commit message
- Push the branch to origin
- First time: open a PR with \`gh pr create --fill\`
- Subsequent pushes: just push (PR auto-updates)
- Capture the PR URL and number for the review step

$STEP6_CONTENT

### Step 7: DONE
- Output the PR URL
- Output: <promise>$COMPLETION_PROMISE</promise>

IMPORTANT: Only output the promise tag when the PR is genuinely open, the build is green, and $STEP6_DONE_GATE. Do not output false promises to escape the loop.
STATEEOF

# Status display
WORKTREE_STATUS="worktree"
[[ "$NO_WORKTREE" = true ]] && WORKTREE_STATUS="branch (no worktree)"
REVIEW_STATUS="enabled"
[[ "$NO_REVIEW" = true ]] && REVIEW_STATUS="disabled"
TDD_STATUS="off"
[[ "$USE_TDD" = true ]] && TDD_STATUS="on"

cat <<EOF
Ship v2 loop activated!

Task: $TASK
Max iterations: $MAX_ITERATIONS
Isolation: $WORKTREE_STATUS
Review: $REVIEW_STATUS
TDD: $TDD_STATUS
Completion: When PR is open, build is green, and review passes

The loop will keep you iterating until the PR is shipped.

To cancel: /cancel-ship
To monitor: head -10 $STATE_FILE
EOF
