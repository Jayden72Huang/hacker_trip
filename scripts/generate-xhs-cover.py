#!/usr/bin/env python3
"""Generate 小红书 cover image for ht-scan-project skill."""

from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1242, 1660
BG = (248, 248, 248)
BLACK = (20, 20, 20)
WHITE = (255, 255, 255)
ACCENT_YELLOW = (255, 220, 50)
ACCENT_CYAN = (77, 225, 255)
ACCENT_PURPLE = (124, 93, 255)
DARK_CARD = (30, 30, 35)
GRAY = (140, 140, 140)

img = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)

# Grid background
for x in range(0, W, 40):
    draw.line([(x, 0), (x, H)], fill=(230, 230, 230), width=1)
for y in range(0, H, 40):
    draw.line([(0, y), (W, y)], fill=(230, 230, 230), width=1)

def font(size, bold=False):
    idx = 1 if bold else 0
    try:
        return ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', size, index=idx)
    except:
        return ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc', size)

def mono(size):
    try:
        return ImageFont.truetype('/System/Library/Fonts/SFMono-Regular.otf', size)
    except:
        try:
            return ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', size)
        except:
            return font(size)

def rounded_rect(draw, xy, fill, radius=20):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill)

# === Branding ===
rounded_rect(draw, (50, 50, 280, 100), WHITE, radius=25)
draw.text((70, 55), "Jayden AI星球", fill=BLACK, font=font(28, bold=True))

# === 标签 "开源工具" ===
rounded_rect(draw, (50, 135, 210, 185), ACCENT_CYAN, radius=8)
draw.text((65, 142), "开源 Skill", fill=BLACK, font=font(28, bold=True))

# === Main Title ===
draw.text((50, 210), "一行命令", fill=BLACK, font=font(95, bold=True))
draw.text((50, 330), "AI帮你匹配", fill=BLACK, font=font(95, bold=True))
draw.text((50, 450), "黑客松！", fill=BLACK, font=font(95, bold=True))

# === Terminal mockup (right side, overlapping title area) ===
term_x, term_y = 580, 160
term_w, term_h = 620, 420
# Device frame
rounded_rect(draw, (term_x, term_y, term_x+term_w, term_y+term_h), DARK_CARD, radius=16)
# Terminal top bar
for i, c in enumerate([(255,95,86), (255,189,46), (39,201,63)]):
    draw.ellipse((term_x+18+i*22, term_y+16, term_x+30+i*22, term_y+28), fill=c)
# Terminal content
tf = mono(18)
ty = term_y + 50
lines = [
    ("$ ", (GRAY)),
    ("curl -sfL hackertrip.space/install | bash", (ACCENT_CYAN)),
]
draw.text((term_x+18, ty), "$ ", fill=GRAY, font=tf)
draw.text((term_x+38, ty), "curl -sfL hackertrip.space/install | bash", fill=ACCENT_CYAN, font=tf)

ty += 35
draw.text((term_x+18, ty), "  ✓ Downloaded SKILL.md", fill=(39,201,63), font=tf)
ty += 28
draw.text((term_x+18, ty), "  ✓ Downloaded hackathon data", fill=(39,201,63), font=tf)
ty += 28
draw.text((term_x+18, ty), "  ✅ Claude Code", fill=ACCENT_CYAN, font=tf)
ty += 28
draw.text((term_x+18, ty), "  ✅ Cursor", fill=ACCENT_CYAN, font=tf)
ty += 28
draw.text((term_x+18, ty), "  ✅ Windsurf", fill=ACCENT_CYAN, font=tf)
ty += 40
draw.text((term_x+18, ty), "  安装完成！", fill=WHITE, font=font(20, bold=True))
ty += 30
draw.text((term_x+18, ty), "  输入 /ht-scan-project 开始扫描", fill=GRAY, font=tf)

# === Badges ===
badge_y = 590
rounded_rect(draw, (50, badge_y, 310, badge_y+55), ACCENT_YELLOW, radius=10)
draw.text((68, badge_y+8), "支持6款AI助手", fill=BLACK, font=font(28, bold=True))

rounded_rect(draw, (330, badge_y, 570, badge_y+55), ACCENT_YELLOW, radius=10)
draw.text((348, badge_y+8), "100%本地运行", fill=BLACK, font=font(28, bold=True))

# === Second terminal - scan result ===
t2_x, t2_y = 50, 690
t2_w, t2_h = W - 100, 520
rounded_rect(draw, (t2_x, t2_y, t2_x+t2_w, t2_y+t2_h), DARK_CARD, radius=16)
# Top bar
for i, c in enumerate([(255,95,86), (255,189,46), (39,201,63)]):
    draw.ellipse((t2_x+18+i*22, t2_y+16, t2_x+30+i*22, t2_y+28), fill=c)

tf2 = mono(19)
ty2 = t2_y + 50

draw.text((t2_x+18, ty2), "$ /ht-scan-project", fill=ACCENT_CYAN, font=tf2)
ty2 += 40

draw.text((t2_x+18, ty2), "📦 Project Profile", fill=WHITE, font=font(22, bold=True))
ty2 += 32
draw.text((t2_x+18, ty2), "   Name:   my-ai-app", fill=(180,180,180), font=tf2)
ty2 += 26
draw.text((t2_x+18, ty2), "   Stack:  Next.js, Claude SDK, Three.js", fill=(180,180,180), font=tf2)
ty2 += 26
draw.text((t2_x+18, ty2), "   Domain: AI Application Platform", fill=(180,180,180), font=tf2)
ty2 += 40

draw.text((t2_x+18, ty2), "🎯 PROJECT → HACKATHON MATCHER", fill=ACCENT_YELLOW, font=font(22, bold=True))
ty2 += 38

results = [
    ("#1  AdventureX 2026", "Score: 92/100", ACCENT_CYAN),
    ("    Best Track: AI 应用创新", "", (180,180,180)),
    ("    Pitch: \"AI-native dev tool powered by Claude\"", "", (180,180,180)),
    ("", "", None),
    ("#2  腾讯云黑客松·总决赛", "Score: 87/100", ACCENT_CYAN),
    ("    Best Track: AI智能体争霸", "", (180,180,180)),
    ("", "", None),
    ("#3  BEYOND HACK DAY", "Score: 81/100", ACCENT_CYAN),
]

for text, score, color in results:
    if color is None:
        ty2 += 8
        continue
    draw.text((t2_x+18, ty2), text, fill=color, font=tf2)
    if score:
        draw.text((t2_x+t2_w-220, ty2), score, fill=ACCENT_YELLOW, font=tf2)
    ty2 += 26

# === Bottom CTA card ===
cta_y = 1260
rounded_rect(draw, (50, cta_y, W-50, cta_y+110), BLACK, radius=16)
draw.text((85, cta_y+15), "扫描项目代码 → AI语义匹配 → 一键报名黑客松", fill=WHITE, font=font(28, bold=True))
draw.text((85, cta_y+60), "不是关键词匹配，是 Claude 真正理解你的项目做什么", fill=GRAY, font=font(22))

# === Bottom info ===
draw.text((50, 1420), "curl -sfL hackertrip.space/install | bash", fill=ACCENT_PURPLE, font=mono(30))

draw.text((50, 1480), "支持：Claude Code · Cursor · Windsurf · Codex · Trae · Gemini", fill=GRAY, font=font(24))

# === Footer ===
rounded_rect(draw, (50, 1560, W-50, 1620), WHITE, radius=12)
draw.text((80, 1570), "🌐 hackertrip.space — 中国黑客松聚合平台 · 开源免费 · 10秒安装", fill=BLACK, font=font(26, bold=True))

out = '/Users/jaydenworkplace/Desktop/hacker_trip/public/images/xhs-cover-skill.png'
img.save(out, 'PNG', quality=95)
print(f'Saved to {out}')
print(f'Size: {W}x{H}')
