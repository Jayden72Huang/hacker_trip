#!/usr/bin/env python3
"""Generate the ViberCard cyberpunk identity card image with OpenAI Images."""

from __future__ import annotations

import argparse
import base64
import os
import sys
import urllib.request
from pathlib import Path

from openai import OpenAI


DEFAULT_OUTPUT = Path(
    "/Users/jaydenworkplace/Desktop/hacker_trip/generated_images/vibecard_3d.png"
)

PROMPT = """
Create a photorealistic premium 3D product render of a futuristic cyberpunk
titanium identity card named "ViberCard".

Composition:
- Single ISO credit card proportion card, exactly 85.6 x 53.98mm ratio,
  approximately 1.586:1.
- The card is tilted about 15 degrees in 3D space, with perspective visible
  and a realistic metallic edge thickness of about 2mm.
- The full card must be visible with clean padding around it.
- Background is pure dark #05060a with a subtle purple radial glow behind the
  card and a soft purple shadow below it.

Material and lighting:
- Dark brushed titanium metal, premium collector-card finish.
- Subtle purple #7c5dff and cyan #4de1ff holographic reflections across the
  brushed metal.
- Purple rim light from the left, cyan accent light from the right, and a warm
  key light from above.
- Subtle scanline overlay for a cyberpunk HUD feel, but keep the text legible.

Card face layout and exact text:
- HUD corner brackets in purple and cyan at all four corners.
- Top row: "VIBERCARD" in small caps, faded white monospace.
- Top right: "Lv.42" with a glowing purple dot beside it.
- A thin purple-to-cyan gradient separator line below the top row.
- Profile area: a purple gradient avatar square, then "Jayden Huang" in bold
  white monospace, "@jayden72" in gray below, and an "AI BUILDER" badge.
- Four stat boxes in one row with exact labels:
  "7 黑客松", "5 组队", "12 连胜", "87 匹配".
- DAMC progress bars labeled D, A, M, C:
  D is purple, A is pink, M is cyan, C is rose.
- Large glowing cyan token count: "12.8M".
- Tech tags: React, TypeScript, Next.js, Solidity, Python, Tailwind.
- Footer includes compact project names and serial "HT-7C5D-0072".

Typography and style:
- Clean futuristic monospace typography, crisp and readable.
- Premium cyberpunk, metallic, futuristic collector identity card.
- Photorealistic 3D render, high detail, sharp focus, realistic reflections,
  no watermark, no extra logos, no hands, no people, no duplicated cards.
""".strip()


def load_env_file_key(start: Path) -> str | None:
    """Load OPENAI_API_KEY from local env files without printing secrets."""
    candidates: list[Path] = []
    for directory in [start, *start.parents]:
        for name in (".env.local", ".env", ".env.development.local", ".env.development"):
            path = directory / name
            if path not in candidates:
                candidates.append(path)

    for path in candidates:
        if not path.is_file():
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            lines = path.read_text(errors="ignore").splitlines()

        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            if key.strip() != "OPENAI_API_KEY":
                continue
            value = value.strip().strip('"').strip("'")
            if value:
                return value
    return None


def get_openai_api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if key:
        return key

    env_file_key = load_env_file_key(Path.cwd())
    if env_file_key:
        return env_file_key

    raise RuntimeError(
        "OPENAI_API_KEY is not set in the shell and was not found in local .env files."
    )


def image_bytes_from_response(response) -> bytes:
    first = response.data[0]

    b64_json = getattr(first, "b64_json", None)
    if b64_json:
        return base64.b64decode(b64_json)

    url = getattr(first, "url", None)
    if url:
        with urllib.request.urlopen(url, timeout=120) as remote:
            return remote.read()

    raise RuntimeError("The OpenAI image response did not include b64_json or url data.")


def generate_image(output: Path, model: str) -> None:
    client = OpenAI(api_key=get_openai_api_key())

    output.parent.mkdir(parents=True, exist_ok=True)

    if model == "dall-e-3":
        response = client.images.generate(
            model=model,
            prompt=PROMPT,
            size="1792x1024",
            quality="hd",
            style="vivid",
            response_format="b64_json",
            n=1,
        )
    else:
        response = client.images.generate(
            model=model,
            prompt=PROMPT,
            size="1536x1024",
            quality="high",
            output_format="png",
            n=1,
        )

    output.write_bytes(image_bytes_from_response(response))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the ViberCard 3D cyberpunk titanium card PNG."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output PNG path. Default: {DEFAULT_OUTPUT}",
    )
    parser.add_argument(
        "--model",
        default="gpt-image-1",
        choices=("gpt-image-1", "dall-e-3"),
        help="OpenAI image model to use. Default: gpt-image-1.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        generate_image(args.output, args.model)
    except Exception as exc:
        print(f"Failed to generate ViberCard image: {exc}", file=sys.stderr)
        return 1

    print(f"Saved ViberCard image to: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
