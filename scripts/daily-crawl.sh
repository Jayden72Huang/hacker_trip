#!/bin/bash
# launchd wrapper：设置 PATH + 切到项目目录后执行每日爬取
# launchd 不经过 shell profile，必须显式设 PATH 并用绝对工作目录
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd /Users/jaydenworkplace/Desktop/hacker_trip || exit 1
echo "===== $(date '+%Y-%m-%d %H:%M:%S') 启动每日爬取 ====="
exec npx tsx scripts/daily-crawl.ts
