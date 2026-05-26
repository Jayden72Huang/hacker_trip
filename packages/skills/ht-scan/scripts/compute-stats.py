#!/usr/bin/env python3
"""HackerTrip Scan — analyze AI conversation sessions to extract DAMC, skills, tokens."""

from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

OUTPUT_DIR = Path("_ht_scan")

# ---------------------------------------------------------------------------
# DAMC keyword signals
# ---------------------------------------------------------------------------

DAMC_SIGNALS: dict[str, list[str]] = {
    "D": [  # Design
        "ui", "ux", "design", "layout", "css", "tailwind", "style", "color",
        "font", "responsive", "animation", "component", "figma", "sketch",
        "wireframe", "mockup", "theme", "dark mode", "gradient", "icon",
        "sidebar", "navbar", "modal", "card", "grid", "flex", "spacing",
    ],
    "A": [  # Analyze
        "debug", "error", "fix", "bug", "investigate", "analyze", "log",
        "trace", "profile", "benchmark", "optimize", "performance", "memory",
        "query", "sql", "database", "migration", "schema", "data", "metric",
        "dashboard", "monitoring", "test", "assert", "coverage", "lint",
    ],
    "M": [  # Market
        "seo", "marketing", "growth", "launch", "deploy", "ship", "release",
        "user", "customer", "feedback", "analytics", "conversion", "funnel",
        "landing", "copy", "content", "blog", "social", "twitter", "product",
        "pitch", "demo", "presentation", "docs", "readme", "onboarding",
    ],
    "C": [  # Code
        "function", "class", "import", "export", "async", "await", "promise",
        "api", "route", "endpoint", "server", "client", "fetch", "request",
        "response", "middleware", "auth", "token", "session", "hook", "state",
        "redux", "context", "ref", "effect", "callback", "type", "interface",
        "generic", "enum", "module", "package", "build", "compile", "bundle",
    ],
}

# ---------------------------------------------------------------------------
# Tech stack detection patterns
# ---------------------------------------------------------------------------

TECH_PATTERNS: dict[str, list[str]] = {
    "TypeScript": [r"\.tsx?$", r"typescript", r"ts-node"],
    "JavaScript": [r"\.jsx?$", r"javascript", r"node\.js"],
    "Python": [r"\.py$", r"python", r"pip ", r"venv"],
    "React": [r"react", r"jsx", r"usestate", r"useeffect", r"component"],
    "Next.js": [r"next\.js", r"next\.config", r"app/.*page\.tsx", r"getserverside"],
    "Vue": [r"\.vue$", r"vuejs", r"nuxt"],
    "Tailwind": [r"tailwind", r"className=", r"tw-"],
    "Node.js": [r"node", r"express", r"koa", r"hono", r"fastify"],
    "PostgreSQL": [r"postgres", r"psql", r"pgTable", r"drizzle", r"prisma"],
    "MongoDB": [r"mongo", r"mongoose"],
    "Redis": [r"redis", r"ioredis"],
    "Docker": [r"docker", r"dockerfile", r"compose"],
    "Rust": [r"\.rs$", r"cargo", r"rust"],
    "Go": [r"\.go$", r"golang", r"go mod"],
    "Solidity": [r"\.sol$", r"solidity", r"hardhat", r"ethers"],
    "Swift": [r"\.swift$", r"swiftui", r"xcode"],
    "Kotlin": [r"\.kt$", r"kotlin", r"android"],
    "SQL": [r"select\s+", r"insert\s+into", r"create\s+table"],
    "GraphQL": [r"graphql", r"gql`", r"mutation", r"subscription"],
    "AWS": [r"aws", r"s3", r"lambda", r"dynamodb", r"cloudformation"],
    "Cloudflare": [r"cloudflare", r"workers", r"wrangler", r"r2"],
    "Vercel": [r"vercel", r"edge function"],
    "Git": [r"git\s+(commit|push|pull|merge|rebase|checkout)"],
}

# ---------------------------------------------------------------------------
# Session parsers
# ---------------------------------------------------------------------------


def parse_claude_code_jsonl(path: str) -> list[dict]:
    """Parse Claude Code JSONL session files."""
    messages: list[dict] = []
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue

                role = obj.get("role", "")
                content = ""
                ts = obj.get("timestamp", "")

                raw = obj.get("message", obj)
                if isinstance(raw.get("content"), str):
                    content = raw["content"]
                elif isinstance(raw.get("content"), list):
                    parts = []
                    for p in raw["content"]:
                        if isinstance(p, dict) and p.get("type") == "text":
                            parts.append(p.get("text", ""))
                        elif isinstance(p, str):
                            parts.append(p)
                    content = "\n".join(parts)

                if not role:
                    role = raw.get("role", "")

                if content and role in ("user", "assistant", "human"):
                    messages.append({"role": role, "content": content, "ts": ts})
    except Exception:
        pass
    return messages


def parse_cursor_txt(path: str) -> list[dict]:
    """Parse Cursor plain-text transcripts."""
    messages: list[dict] = []
    try:
        text = Path(path).read_text(encoding="utf-8", errors="ignore")
        current_role = ""
        current_content: list[str] = []

        for line in text.splitlines():
            if line.startswith("user:"):
                if current_role and current_content:
                    messages.append({"role": current_role, "content": "\n".join(current_content), "ts": ""})
                current_role = "user"
                current_content = [line[5:].strip()]
            elif line.startswith("assistant:"):
                if current_role and current_content:
                    messages.append({"role": current_role, "content": "\n".join(current_content), "ts": ""})
                current_role = "assistant"
                current_content = [line[10:].strip()]
            else:
                current_content.append(line)

        if current_role and current_content:
            messages.append({"role": current_role, "content": "\n".join(current_content), "ts": ""})
    except Exception:
        pass
    return messages


def parse_codex_jsonl(path: str) -> list[dict]:
    """Parse Codex JSONL session/history files."""
    messages: list[dict] = []
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue

                role = obj.get("role", obj.get("type", ""))
                content = obj.get("content", obj.get("message", ""))
                ts = obj.get("timestamp", obj.get("ts", ""))

                if isinstance(content, list):
                    content = " ".join(str(c) for c in content)
                if isinstance(content, str) and content and role in ("user", "assistant", "human"):
                    messages.append({"role": role, "content": content, "ts": ts})
    except Exception:
        pass
    return messages


def parse_gemini_json(path: str) -> list[dict]:
    """Parse Gemini CLI JSON session files."""
    messages: list[dict] = []
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8", errors="ignore"))
        entries = data if isinstance(data, list) else data.get("messages", data.get("turns", []))
        for entry in entries:
            role = entry.get("role", entry.get("type", ""))
            content = entry.get("content", entry.get("text", ""))
            ts = entry.get("timestamp", "")
            if isinstance(content, list):
                content = " ".join(p.get("text", str(p)) if isinstance(p, dict) else str(p) for p in content)
            if content and role in ("user", "model", "assistant"):
                messages.append({"role": "user" if role == "user" else "assistant", "content": content, "ts": ts})
    except Exception:
        pass
    return messages


def parse_generic_jsonl(path: str) -> list[dict]:
    """Fallback JSONL parser for OpenClaw, Windsurf, Trae, etc."""
    messages: list[dict] = []
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                role = obj.get("role", obj.get("type", ""))
                content = obj.get("content", obj.get("message", obj.get("text", "")))
                ts = obj.get("timestamp", obj.get("ts", ""))
                if isinstance(content, list):
                    content = " ".join(str(c) for c in content)
                if isinstance(content, str) and content and role in ("user", "assistant", "human", "model"):
                    messages.append({"role": "user" if role in ("user", "human") else "assistant", "content": content, "ts": ts})
    except Exception:
        pass
    return messages


def parse_chatgpt_json(path: str) -> list[dict]:
    """Parse ChatGPT export JSON."""
    messages: list[dict] = []
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8", errors="ignore"))
        convos = data if isinstance(data, list) else [data]
        for convo in convos:
            mapping = convo.get("mapping", {})
            for node in mapping.values():
                msg = node.get("message")
                if not msg:
                    continue
                role = msg.get("author", {}).get("role", "")
                parts = msg.get("content", {}).get("parts", [])
                content = " ".join(str(p) for p in parts if isinstance(p, str))
                ts = msg.get("create_time", "")
                if content and role in ("user", "assistant"):
                    messages.append({"role": role, "content": content, "ts": str(ts) if ts else ""})
    except Exception:
        pass
    return messages


PARSERS = {
    "claude-code": parse_claude_code_jsonl,
    "cursor": lambda p: parse_cursor_txt(p) if p.endswith(".txt") else parse_codex_jsonl(p),
    "codex": parse_codex_jsonl,
    "openclaw": parse_generic_jsonl,
    "gemini": parse_gemini_json,
    "windsurf": parse_generic_jsonl,
    "trae": parse_generic_jsonl,
    "chatgpt": parse_chatgpt_json,
}

# ---------------------------------------------------------------------------
# Analysis engine
# ---------------------------------------------------------------------------


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def compute_damc(all_text: str) -> dict[str, int]:
    text_lower = all_text.lower()
    raw: dict[str, int] = {}
    for dim, keywords in DAMC_SIGNALS.items():
        score = sum(text_lower.count(kw) for kw in keywords)
        raw[dim] = score

    total = sum(raw.values()) or 1
    scores = {}
    for dim in "DAMC":
        normalized = min(100, int((raw[dim] / total) * 400))
        scores[dim] = max(5, normalized)
    return scores


def extract_skills(all_text: str) -> list[str]:
    text_lower = all_text.lower()
    skill_scores: Counter = Counter()
    for tech, patterns in TECH_PATTERNS.items():
        count = 0
        for pat in patterns:
            count += len(re.findall(pat, text_lower))
        if count > 0:
            skill_scores[tech] = count
    return [s for s, _ in skill_scores.most_common(15)]


def extract_activity(messages: list[dict]) -> dict:
    daily: dict[str, int] = defaultdict(int)
    for msg in messages:
        ts = msg.get("ts", "")
        if not ts:
            continue
        try:
            if isinstance(ts, (int, float)):
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            else:
                ts_str = str(ts)[:19]
                for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M"):
                    try:
                        dt = datetime.strptime(ts_str, fmt).replace(tzinfo=timezone.utc)
                        break
                    except ValueError:
                        continue
                else:
                    continue
            day = dt.strftime("%Y-%m-%d")
            daily[day] += 1
        except Exception:
            continue
    return dict(sorted(daily.items()))


def compute_tier(tokens: int, damc: dict[str, int]) -> dict:
    avg = sum(damc.values()) / len(damc) if damc else 0

    if tokens >= 10_000_000 and avg >= 75:
        return {"tier": "diamond", "level": 99, "label": "Diamond"}
    elif tokens >= 5_000_000 and avg >= 60:
        return {"tier": "platinum", "level": 50, "label": "Platinum"}
    elif tokens >= 1_000_000 or avg >= 40:
        return {"tier": "gold", "level": 25, "label": "Gold"}
    else:
        return {"tier": "bronze", "level": 10, "label": "Bronze"}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    if len(sys.argv) < 2:
        print("Usage: compute-stats.py <session-list-file>", file=sys.stderr)
        sys.exit(1)

    session_list_path = sys.argv[1]
    if not os.path.isfile(session_list_path):
        print(f"Session list not found: {session_list_path}", file=sys.stderr)
        sys.exit(1)

    with open(session_list_path) as f:
        lines = [l.strip() for l in f if l.strip()]

    if not lines:
        print("No sessions to analyze.", file=sys.stderr)
        sys.exit(1)

    all_messages: list[dict] = []
    source_counts: Counter = Counter()
    total_tokens = 0

    print(f"Analyzing {len(lines)} sessions...\n")

    for line in lines:
        if "|" in line:
            source, path = line.split("|", 1)
        else:
            source, path = "unknown", line

        parser = PARSERS.get(source, parse_generic_jsonl)
        messages = parser(path)

        if messages:
            source_counts[source] += 1
            all_messages.extend(messages)
            for msg in messages:
                total_tokens += estimate_tokens(msg["content"])

    if not all_messages:
        print("No messages extracted from sessions.", file=sys.stderr)
        sys.exit(1)

    # Print source summary
    for src, count in source_counts.most_common():
        print(f"  {src}: {count} sessions")
    print(f"\n  Total messages: {len(all_messages)}")
    print(f"  Estimated tokens: {total_tokens:,}")

    # Combine all text for analysis
    all_text = "\n".join(msg["content"] for msg in all_messages)

    # Compute results
    damc = compute_damc(all_text)
    skills = extract_skills(all_text)
    activity = extract_activity(all_messages)
    tier = compute_tier(total_tokens, damc)

    # Write output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    (OUTPUT_DIR / "damc.json").write_text(json.dumps(damc, indent=2))
    (OUTPUT_DIR / "skills.json").write_text(json.dumps(skills, indent=2))
    (OUTPUT_DIR / "stats.json").write_text(json.dumps({
        "totalTokens": total_tokens,
        "totalMessages": len(all_messages),
        "sessionsAnalyzed": sum(source_counts.values()),
        "activeDays": len(activity),
        "sources": dict(source_counts),
    }, indent=2))
    (OUTPUT_DIR / "activity.json").write_text(json.dumps(activity, indent=2))
    (OUTPUT_DIR / "tier.json").write_text(json.dumps(tier, indent=2))

    print(f"\nResults saved to {OUTPUT_DIR}/")
    print(f"  damc.json / skills.json / stats.json / activity.json / tier.json")


if __name__ == "__main__":
    main()
