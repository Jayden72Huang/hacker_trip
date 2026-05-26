#!/usr/bin/env bash
set -euo pipefail

DAYS="${HT_DAYS:-30}"
SOURCES="${HT_SOURCES:-}"
SESSION_LIST="${SESSION_LIST:-$(mktemp /tmp/ht-sessions-XXXXXX.txt)}"

: > "$SESSION_LIST"
found_count=0

should_scan() {
  local name="$1"
  [ -z "$SOURCES" ] && return 0
  echo ",$SOURCES," | grep -qi ",$name," && return 0
  return 1
}

add_recent_files() {
  local dir="$1"
  local ext="$2"
  local source="$3"
  local count=0

  [ -d "$dir" ] || return 0

  if [ "$(uname)" = "Darwin" ]; then
    cutoff=$(date -v-"${DAYS}d" +%s 2>/dev/null || echo 0)
  else
    cutoff=$(date -d "$DAYS days ago" +%s 2>/dev/null || echo 0)
  fi

  while IFS= read -r f; do
    [ -f "$f" ] || continue
    if [ "$(uname)" = "Darwin" ]; then
      mod=$(stat -f %m "$f" 2>/dev/null || echo 0)
    else
      mod=$(stat -c %Y "$f" 2>/dev/null || echo 0)
    fi
    if [ "$mod" -ge "$cutoff" ]; then
      echo "$source|$f" >> "$SESSION_LIST"
      count=$((count + 1))
    fi
  done < <(find "$dir" -maxdepth 3 -name "$ext" -type f 2>/dev/null)

  found_count=$((found_count + count))
  if [ "$count" -gt 0 ]; then
    echo "  $source: $count sessions"
  fi
}

echo "Scanning AI conversations (last $DAYS days)..."
echo ""

# Claude Code
if should_scan "claude-code" && [ -d "$HOME/.claude/projects" ]; then
  add_recent_files "$HOME/.claude/projects" "*.jsonl" "claude-code"
fi

# Cursor
if should_scan "cursor" && [ -d "$HOME/.cursor/projects" ]; then
  add_recent_files "$HOME/.cursor/projects" "*.txt" "cursor"
  add_recent_files "$HOME/.cursor/projects" "*.jsonl" "cursor"
fi

# Codex
if should_scan "codex" && [ -d "$HOME/.codex" ]; then
  add_recent_files "$HOME/.codex/sessions" "*.jsonl" "codex"
  if [ -f "$HOME/.codex/history.jsonl" ]; then
    echo "codex|$HOME/.codex/history.jsonl" >> "$SESSION_LIST"
    found_count=$((found_count + 1))
  fi
fi

# OpenClaw
if should_scan "openclaw" && [ -d "$HOME/.openclaw" ]; then
  add_recent_files "$HOME/.openclaw/sessions" "*.jsonl" "openclaw"
  add_recent_files "$HOME/.openclaw/agents" "*.jsonl" "openclaw"
fi

# Gemini CLI
if should_scan "gemini" && [ -d "$HOME/.gemini" ]; then
  add_recent_files "$HOME/.gemini/tmp" "session-*.json" "gemini"
fi

# Windsurf
if should_scan "windsurf"; then
  for wdir in "$HOME/.codeium/windsurf" "$HOME/.windsurf"; do
    [ -d "$wdir" ] && add_recent_files "$wdir" "*.json" "windsurf"
  done
fi

# Trae
if should_scan "trae"; then
  for tdir in "$HOME/.trae" "$HOME/.trae-cn"; do
    if [ -f "$tdir/chat-export.json" ]; then
      echo "trae|$tdir/chat-export.json" >> "$SESSION_LIST"
      found_count=$((found_count + 1))
      echo "  trae: 1 export file"
    fi
  done
fi

# ChatGPT export
if should_scan "chatgpt"; then
  for cdir in "$HOME/Downloads" "$HOME/Documents"; do
    [ -d "$cdir" ] && add_recent_files "$cdir" "conversations*.json" "chatgpt"
  done
fi

echo ""

if [ "$found_count" -eq 0 ]; then
  echo "No AI conversation sessions found in the last $DAYS days."
  echo "Supported: Claude Code, Cursor, Codex, OpenClaw, Gemini CLI, Windsurf, Trae, ChatGPT"
  rm -f "$SESSION_LIST"
  exit 1
fi

dedup=$(sort -t'|' -k2 -u "$SESSION_LIST" | wc -l | tr -d ' ')
sort -t'|' -k2 -u "$SESSION_LIST" -o "$SESSION_LIST"

echo "Total: $dedup unique sessions"
echo "$SESSION_LIST"
