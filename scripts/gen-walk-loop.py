#!/usr/bin/env python3
"""用 Seedance 1.5 Pro 以首帧=尾帧生成「主角往前穿行」的无缝循环视频。"""
import base64, json, os, sys, time, urllib.request

ARK_KEY = os.environ["ARK_API_KEY"]
MODEL = "ep-20260602172719-84tc7"
BASE = "https://ark.cn-beijing.volces.com/api/v3"
IMG = "gemini-frame2.png"
OUT = "public/videos/walk-loop4.mp4"

PROMPT = (
    "镜头从背后第一人称跟随这位身穿长风衣的主角，沿着这条赛博朋克 AI 科技街道持续匀速向前行走。"
    "主角自然迈步前进，镜头同步缓慢向前推进，穿行于两侧 AI 品牌招牌、悬浮的 AI-Coin 代币与全息广告牌之间。"
    "两侧发光与哑光招牌、全息面板、悬浮代币与青色品红色的数据流光带轻微浮动、缓缓向画面两侧掠过流动，"
    "所有品牌 logo、文字与 AI-Coin 元素保持清晰稳定、绝不变形扭曲，湿润地面的霓虹倒影随之闪烁波动，"
    "远处灭点处雾气弥漫。整体保持沉浸式无限向前穿行的运镜感，运动连贯流畅、速度均匀。"
    "画面首帧与尾帧完全一致，形成完美无缝的循环衔接，看不出循环接缝。"
)

def b64(p):
    with open(p, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()

def post(path, payload):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Authorization": "Bearer " + ARK_KEY, "Content-Type": "application/json"},
        method="POST",
    )
    return json.load(urllib.request.urlopen(req))

def get(path):
    req = urllib.request.Request(BASE + path, headers={"Authorization": "Bearer " + ARK_KEY})
    return json.load(urllib.request.urlopen(req))

img = b64(IMG)
payload = {
    "model": MODEL,
    "content": [
        {"type": "text", "text": PROMPT + " --resolution 720p --ratio 16:9 --duration 5"},
        {"type": "image_url", "image_url": {"url": img}, "role": "first_frame"},
        {"type": "image_url", "image_url": {"url": img}, "role": "last_frame"},
    ],
}
print("提交任务...", flush=True)
r = post("/contents/generations/tasks", payload)
tid = r["id"]
print("task id:", tid, flush=True)

url = None
for i in range(80):
    time.sleep(8)
    s = get("/contents/generations/tasks/" + tid)
    st = s.get("status")
    print(f"[{i}] status={st}", flush=True)
    if st == "succeeded":
        url = s["content"]["video_url"]
        break
    if st == "failed":
        print("FAILED:", json.dumps(s, ensure_ascii=False), flush=True)
        sys.exit(1)

if not url:
    print("超时未完成", flush=True)
    sys.exit(1)

print("下载视频...", flush=True)
urllib.request.urlretrieve(url, OUT)
print("已保存:", OUT, os.path.getsize(OUT), "bytes", flush=True)
