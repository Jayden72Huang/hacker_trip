#!/usr/bin/env python3
"""用 Gemini (Nano Banana Pro) 图生图：基于单主角行走底图，加入 AI 厂商 logo + AI-Coin 黑客松元素。"""
import base64, json, os, re, sys, urllib.request

KEY = None
with open(".env.local") as f:
    for line in f:
        m = re.match(r"\s*GOOGLE_API_KEY\s*=\s*(.+?)\s*$", line)
        if m:
            KEY = m.group(1).strip().strip('"').strip("'")
            break
if not KEY:
    print("未找到 GOOGLE_API_KEY", file=sys.stderr); sys.exit(1)

BASE_IMG = "walk-frame.png"
OUT = "gemini-frame2.png"

PROMPT = (
    "Keep this exact scene, composition, camera angle, and the lone figure walking forward down the "
    "neon cyberpunk street from behind — do NOT move the figure or change the perspective and vanishing point. "
    "Enrich the city with diverse, sophisticated AI-themed decoration:\n"
    "1. Add legible AI model-vendor brand logos and names on the building billboards and facades: "
    "'Anthropic', 'Claude', 'OpenAI', 'Google', 'DeepSeek', 'Qwen', 'Doubao', 'MiniMax', 'Gemini'.\n"
    "2. Add AI-Coin crypto-hackathon elements: a few large floating holographic 'AI-COIN' tokens / glowing "
    "coins with a circuit-pattern engraving, a banner reading 'AI-COIN HACKATHON 2026', a holographic prize "
    "trophy, and subtle streams of flowing code and data.\n"
    "Make the decoration VARIED and futuristic — mix bright glowing neon signage with MATTE, solid, physical "
    "materials: brushed-metal signs, frosted-glass panels, sculpted 3D logos, holographic projections, and "
    "softly-lit architectural surfaces. Do NOT make everything fluorescent or uniformly glowing; keep a "
    "tasteful balance of lit and unlit, glossy and matte surfaces for a premium high-tech look.\n"
    "Preserve the color mood: left side leaning deep violet / magenta, right side leaning cyan / blue, "
    "dark near-black sky, wet reflective ground. Photorealistic, cinematic, highly detailed, natural and "
    "immersive — not stiff. Keep only the single back-facing figure, no extra people. Aspect ratio 16:9."
)

def b64file(p):
    with open(p, "rb") as f:
        return base64.b64encode(f.read()).decode()

MODELS = ["gemini-3-pro-image", "gemini-3.1-flash-image", "gemini-2.5-flash-image"]

def call(model):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}"
    body = {
        "contents": [{
            "parts": [
                {"text": PROMPT},
                {"inlineData": {"mimeType": "image/png", "data": b64file(BASE_IMG)}},
            ]
        }],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "16:9"},
        },
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                headers={"Content-Type": "application/json"}, method="POST")
    return json.load(urllib.request.urlopen(req))

for model in MODELS:
    try:
        print("尝试模型:", model, flush=True)
        r = call(model)
        for part in r["candidates"][0]["content"]["parts"]:
            inline = part.get("inlineData") or part.get("inline_data")
            if inline:
                data = base64.b64decode(inline["data"])
                with open(OUT, "wb") as f:
                    f.write(data)
                print("已保存:", OUT, len(data), "bytes  (模型:", model, ")", flush=True)
                sys.exit(0)
        print("该模型未返回图像:", json.dumps(r)[:300], flush=True)
    except urllib.error.HTTPError as e:
        print("HTTP错误:", e.code, e.read().decode()[:300], flush=True)
    except Exception as e:
        print("错误:", str(e), flush=True)

print("全部模型失败", file=sys.stderr); sys.exit(1)
