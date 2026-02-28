#!/bin/bash

# Ship Plugin Stop Hook (v2)
# Prevents session exit when a ship loop is active
# Feeds the workflow prompt back to continue the loop

set -euo pipefail

# State file at absolute path — always reachable regardless of cwd
STATE_FILE="$HOME/.claude/ship-loop.local.md"

# Fast exit if no active ship loop — avoids consuming stdin unnecessarily
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Read hook input from stdin (only when ship loop is active)
HOOK_INPUT=$(cat)

# --- Helpers ---

bail() {
  echo "Ship loop: $1" >&2
  rm -f "$STATE_FILE"
  exit 0
}

get_field() {
  echo "$FRONTMATTER" | grep "^$1:" | sed "s/^$1: *//" | sed 's/^"\(.*\)"$/\1/'
}

require_numeric() {
  local name="$1" value="$2"
  if [[ ! "$value" =~ ^[0-9]+$ ]]; then
    bail "State file corrupted (invalid $name: '$value')"
  fi
}

# --- Parse frontmatter ---

FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$STATE_FILE")
ITERATION=$(get_field iteration)
MAX_ITERATIONS=$(get_field max_iterations)
COMPLETION_PROMISE=$(get_field completion_promise)

require_numeric "iteration" "$ITERATION"
require_numeric "max_iterations" "$MAX_ITERATIONS"

# Check if max iterations reached
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "Ship loop: Max iterations ($MAX_ITERATIONS) reached. Stopping."
  rm -f "$STATE_FILE"
  exit 0
fi

# --- Check transcript for completion ---

TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

[[ ! -f "$TRANSCRIPT_PATH" ]] && bail "Transcript file not found"

# Read last assistant message (scan from end for efficiency)
LAST_LINE=$(tac "$TRANSCRIPT_PATH" | grep -m1 '"role":"assistant"' || true)
[[ -z "$LAST_LINE" ]] && bail "No assistant messages found in transcript"

LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
  .message.content |
  map(select(.type == "text")) |
  map(.text) |
  join("\n")
' 2>/dev/null || true)

[[ -z "$LAST_OUTPUT" ]] && bail "Failed to parse assistant message"

# Check for completion promise — exact match on machine token
if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
  PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")

  if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
    echo "Ship complete! PR is open, build is green, and review is done."
    rm -f "$STATE_FILE"
    exit 0
  fi
fi

# --- Not complete — continue loop ---

NEXT_ITERATION=$((ITERATION + 1))

PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$STATE_FILE")
[[ -z "$PROMPT_TEXT" ]] && bail "No prompt found in state file"

# Update iteration counter
TEMP_FILE="${STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$STATE_FILE"

# Block exit and feed prompt back
SYSTEM_MSG="Ship iteration $NEXT_ITERATION | To complete: output <promise>$COMPLETION_PROMISE</promise> (ONLY when PR is open, build is green, and review is done)"

jq -n \
  --arg prompt "$PROMPT_TEXT" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": $prompt,
    "systemMessage": $msg
  }'

exit 0
