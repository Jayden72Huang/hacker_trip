#!/usr/bin/env python3
"""用 Gemini (Nano Banana Pro) 生成赛博朋克 AI 街区首帧图。"""
import base64, json, os, re, sys, urllib.request

# 从 .env.local 读取 GOOGLE_API_KEY（不打印）
KEY = None
with open(".env.local") as f:
    for line in f:
        m = re.match(r"\s*GOOGLE_API_KEY\s*=\s*(.+?)\s*$", line)
        if m:
            KEY = m.group(1).strip().strip('"').strip("'")
            break
if not KEY:
    print("未找到 GOOGLE_API_KEY", file=sys.stderr); sys.exit(1)

PROMPT = (
    "A breathtaking cinematic over-the-shoulder shot from behind a crowd of diverse people "
    "walking forward together down a wide, rain-slicked neon cyberpunk street at night, seen as "
    "natural backlit silhouettes mid-stride, walking away from the camera into the depth of the scene. "
    "Strong symmetrical one-point perspective: the wet reflective street recedes to a single vanishing "
    "point at the exact horizontal center near the horizon. This is a futuristic AI tech district. "
    "Towering skyscrapers and giant glowing holographic billboards on both sides display crisp, legible "
    "AI company brand names and logos: 'Anthropic', 'Claude', 'Google', 'OpenAI', 'DeepSeek', 'Qwen', "
    "'Doubao', 'MiniMax'. A few side holographic panels show short announcement headlines: "
    "'CLAUDE CODE - NEW MODEL', 'MINIMAX UPDATE', 'HACKATHON 2026'. Futuristic AI data-center structures "
    "with glowing server racks and cyan cooling light, streams of flowing data and code between buildings. "
    "Left-side buildings glow deep violet and magenta-pink; right-side buildings glow electric cyan and blue. "
    "Volumetric atmospheric haze near the vanishing point, dark near-black sky, vivid colorful neon reflections "
    "on the wet ground. Photorealistic, filmic, highly detailed, alive and immersive, natural depth of field, "
    "cinematic lighting. The crowd seen only from behind, no faces. Aspect ratio 16:9."
)

MODELS = ["gemini-3-pro-image", "gemini-3.1-flash-image", "gemini-2.5-flash-image"]
OUT = "gemini-frame.png"

def call(model):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}"
    body = {
        "contents": [{"parts": [{"text": PROMPT}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "16:9"},
        },
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                headers={"Content-Type": "application/json"}, method="POST")
    return json.load(urllib.request.urlopen(req))

last_err = None
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
        print("该模型未返回图像，响应片段:", json.dumps(r)[:300], flush=True)
    except urllib.error.HTTPError as e:
        last_err = e.read().decode()[:400]
        print("HTTP错误:", e.code, last_err, flush=True)
    except Exception as e:
        last_err = str(e)
        print("错误:", last_err, flush=True)

print("全部模型失败", file=sys.stderr)
sys.exit(1)
