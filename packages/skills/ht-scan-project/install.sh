#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://raw.githubusercontent.com/Jayden72Huang/hacker_trip/main/packages/skills/ht-scan-project"
INSTALL_DIR="$HOME/.hackertrip/skills/ht-scan-project"

TARGETS=(
  "$HOME/.claude/skills"
  "$HOME/.cursor/skills"
  "$HOME/.codex/skills"
  "$HOME/.trae/skills"
  "$HOME/.windsurf/skills"
  "$HOME/.gemini/antigravity/global_workflows"
)

ok()   { printf "  \033[32m✓\033[0m %s\n" "$*"; }
info() { printf "  \033[36m%s\033[0m\n" "$*"; }

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║  🎯 HackerTrip Project Scanner — 安装中...   ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

mkdir -p "$INSTALL_DIR/data"

curl -sfL "$REPO_URL/SKILL.md" -o "$INSTALL_DIR/SKILL.md" || {
  echo "  ❌ 下载失败，请检查网络连接"; exit 1
}
ok "Downloaded SKILL.md"

curl -sfL "$REPO_URL/data/hackathons.json" -o "$INSTALL_DIR/data/hackathons.json" 2>/dev/null || true
ok "Downloaded hackathon data (offline fallback)"

linked=()
for target in "${TARGETS[@]}"; do
  [ -d "$(dirname "$target")" ] || continue
  mkdir -p "$target" 2>/dev/null || continue
  dest="$target/ht-scan-project"
  [ -L "$dest" ] && rm "$dest"
  ln -sf "$INSTALL_DIR" "$dest" 2>/dev/null || continue
  tool_name=$(basename "$(dirname "$target")" | sed 's/^\.//')
  linked+=("$tool_name")
done

echo ""
for tool in "${linked[@]}"; do
  case "$tool" in
    claude)    info "✅ Claude Code" ;;
    cursor)    info "✅ Cursor" ;;
    codex)     info "✅ Codex" ;;
    trae)      info "✅ Trae" ;;
    windsurf)  info "✅ Windsurf" ;;
    gemini)    info "✅ Gemini CLI" ;;
    *)         info "✅ $tool" ;;
  esac
done

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║  安装完成！                                   ║"
echo "  ╠══════════════════════════════════════════════╣"
echo "  ║                                              ║"
echo "  ║  使用方式（3 步）：                            ║"
echo "  ║                                              ║"
echo "  ║  ① 打开 AI 编程助手                           ║"
echo "  ║     Claude Code / Cursor / Windsurf 等       ║"
echo "  ║                                              ║"
echo "  ║  ② 进入你的项目目录                           ║"
echo "  ║     cd your-project && claude                ║"
echo "  ║                                              ║"
echo "  ║  ③ 输入 /ht-scan-project                     ║"
echo "  ║     AI 自动扫描代码并匹配最适合的黑客松        ║"
echo "  ║                                              ║"
echo "  ╠══════════════════════════════════════════════╣"
echo "  ║                                              ║"
echo "  ║  🔒 100% 本地运行，代码不会上传               ║"
echo "  ║  🌐 hackertrip.space — 中国黑客松聚合平台     ║"
echo "  ║                                              ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""
