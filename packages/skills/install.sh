#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://raw.githubusercontent.com/jaydenhtt/hacker_trip/main/packages/skills"
INSTALL_DIR="$HOME/.hackertrip"
VERSION="1"

SKILLS=(ht-scan ht-card ht-collect ht-scan-project)

TARGETS=(
  "$HOME/.claude/skills"
  "$HOME/.cursor/skills"
  "$HOME/.codex/skills"
  "$HOME/.openclaw/skills"
  "$HOME/.trae/skills"
  "$HOME/.windsurf/skills"
  "$HOME/.gemini/antigravity/global_workflows"
)

info()  { printf "  \033[36m%s\033[0m\n" "$*"; }
ok()    { printf "  \033[32m✓\033[0m %s\n" "$*"; }
warn()  { printf "  \033[33m!\033[0m %s\n" "$*"; }

echo ""
echo "Installing HackerTrip skills..."
echo ""

mkdir -p "$INSTALL_DIR/skills"
echo "$VERSION" > "$INSTALL_DIR/VERSION"

for skill in "${SKILLS[@]}"; do
  skill_dir="$INSTALL_DIR/skills/$skill"
  mkdir -p "$skill_dir/scripts"

  curl -sfL "$REPO_URL/$skill/SKILL.md" -o "$skill_dir/SKILL.md" 2>/dev/null || {
    warn "Failed to download $skill/SKILL.md — skipping"
    continue
  }

  for script in discover-sessions.sh compute-stats.py; do
    curl -sfL "$REPO_URL/$skill/scripts/$script" -o "$skill_dir/scripts/$script" 2>/dev/null && \
      chmod +x "$skill_dir/scripts/$script" 2>/dev/null || true
  done

  # Download data files (e.g., hackathons.json for ht-scan-project)
  mkdir -p "$skill_dir/data" 2>/dev/null || true
  for datafile in hackathons.json; do
    curl -sfL "$REPO_URL/$skill/data/$datafile" -o "$skill_dir/data/$datafile" 2>/dev/null || true
  done

  ok "Downloaded $skill"
done

linked=()
for target in "${TARGETS[@]}"; do
  [ -d "$(dirname "$target")" ] || continue
  mkdir -p "$target" 2>/dev/null || continue

  for skill in "${SKILLS[@]}"; do
    src="$INSTALL_DIR/skills/$skill"
    dest="$target/$skill"
    [ -d "$src" ] || continue
    [ -L "$dest" ] && rm "$dest"
    ln -sf "$src" "$dest" 2>/dev/null || continue
  done

  tool_name=$(basename "$(dirname "$target")" | sed 's/^\.//')
  linked+=("$tool_name")
done

echo ""
for tool in "${linked[@]}"; do
  case "$tool" in
    claude)    info "Linked to Claude Code" ;;
    cursor)    info "Linked to Cursor" ;;
    codex)     info "Linked to Codex" ;;
    openclaw)  info "Linked to OpenClaw" ;;
    trae)      info "Linked to Trae" ;;
    windsurf)  info "Linked to Windsurf" ;;
    gemini)    info "Linked to Gemini CLI" ;;
    *)         info "Linked to $tool" ;;
  esac
done

echo ""
echo "Done! ($(IFS=', '; echo "${linked[*]}"))"
echo ""
printf "\033[33m🔒 All analysis runs 100%% locally. Your raw conversations are NEVER uploaded.\033[0m\n"
echo ""
echo "Run /ht-scan to analyze your AI conversations and build your DAMC profile."
echo "Run /ht-scan-project to find matching hackathons for your project."
echo "Run /ht-card to generate your ViberCard."
echo ""
