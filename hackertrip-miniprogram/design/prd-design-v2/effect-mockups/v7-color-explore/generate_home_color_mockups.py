from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import math
import random

W, H = 1024, 1536
OUT = Path(__file__).resolve().parent

FONT = "/System/Library/Fonts/PingFang.ttc"
FONT_LATIN = "/System/Library/Fonts/SFNS.ttf"


def font(size, weight="regular"):
    # PingFang.ttc indexes vary across macOS versions; index 0 is stable enough
    # for clean Chinese UI rendering.
    return ImageFont.truetype(FONT, size=size, index=0)


def latin(size):
    return ImageFont.truetype(FONT_LATIN, size=size)


def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def rgba(value, alpha=255):
    return (*hex_rgb(value), alpha)


def mix(a, b, t):
    ar, ag, ab = hex_rgb(a) if isinstance(a, str) else a[:3]
    br, bg, bb = hex_rgb(b) if isinstance(b, str) else b[:3]
    return (
        int(ar + (br - ar) * t),
        int(ag + (bg - ag) * t),
        int(ab + (bb - ab) * t),
    )


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def shadowed_round(canvas, box, radius, fill, outline=None, shadow=True):
    x0, y0, x1, y1 = box
    if shadow:
        for dy, blur, alpha in ((16, 28, 22), (5, 12, 16), (30, 52, 8)):
            mask = Image.new("L", (W, H), 0)
            md = ImageDraw.Draw(mask)
            md.rounded_rectangle((x0, y0 + dy, x1, y1 + dy), radius=radius, fill=alpha)
            mask = mask.filter(ImageFilter.GaussianBlur(blur))
            layer = Image.new("RGBA", (W, H), (48, 40, 30, 0))
            layer.putalpha(mask)
            canvas.alpha_composite(layer)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=1 if outline else 0)


def text(draw, xy, value, fnt, fill, anchor=None):
    draw.text(xy, value, font=fnt, fill=fill, anchor=anchor)


def pill(draw, box, fill, outline=None):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=(y1 - y0) // 2, fill=fill, outline=outline, width=1 if outline else 0)


def draw_header(canvas, palette):
    d = ImageDraw.Draw(canvas)
    ink = palette["ink"]
    muted = palette["muted"]
    hair = palette["hair"]

    # WeChat capsule.
    pill(d, (842, 46, 966, 84), fill=rgba("#20201E", 235))
    d.ellipse((866, 59, 874, 67), fill=rgba("#FAF9F5", 210))
    d.ellipse((889, 59, 897, 67), fill=rgba("#FAF9F5", 210))
    d.line((925, 56, 925, 74), fill=rgba("#FAF9F5", 80), width=1)
    d.ellipse((941, 57, 958, 74), outline=rgba("#FAF9F5", 210), width=2)

    for box in ((62, 64, 132, 134), (892, 64, 962, 134)):
        shadowed_round(canvas, box, 35, rgba("#FFFFFF", 246), outline=rgba(hair, 210), shadow=False)

    # Hamburger.
    for y in (88, 99, 110):
        d.line((86, y, 108, y), fill=rgba(ink, 230), width=4)

    # Bell.
    d.arc((916, 85, 938, 113), 200, -20, fill=rgba(ink, 230), width=4)
    d.line((915, 107, 940, 107), fill=rgba(ink, 230), width=4)
    d.ellipse((925, 113, 930, 118), fill=rgba(ink, 230))
    d.ellipse((947, 74, 961, 88), fill=rgba("#D83B2D", 255))

    text(d, (512, 75), "HackerTrip", latin(34), rgba(ink, 255), anchor="ma")
    text(d, (512, 116), "AI Hackathon Workspace", latin(18), rgba(muted, 255), anchor="ma")


def draw_thumbnail(canvas, x, y, w, h, accent):
    poster = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(poster)
    top = mix("#F6F2E8", accent, 0.12)
    bot = mix("#17191A", accent, 0.28)
    for yy in range(h):
        t = yy / max(h - 1, 1)
        col = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        pd.line((0, yy, w, yy), fill=(*col, 255))

    random.seed(11)
    for _ in range(28):
        px = random.randint(0, w)
        py = random.randint(0, h)
        a = random.randint(12, 32)
        pd.ellipse((px, py, px + random.randint(2, 6), py + random.randint(2, 6)), fill=(255, 255, 255, a))

    pd.rounded_rectangle((14, 18, w - 14, 44), radius=8, fill=(255, 255, 255, 42))
    pd.rectangle((24, 26, 78, 30), fill=(255, 255, 255, 120))
    pd.rectangle((24, 35, 58, 38), fill=(255, 255, 255, 82))
    for i in range(3):
        cx = 36 + i * 31
        pd.ellipse((cx, 66, cx + 20, 86), fill=(255, 244, 218, 190))
        pd.rounded_rectangle((cx - 6, 86, cx + 26, 124), radius=12, fill=(20, 24, 26, 170))
    pd.line((18, h - 25, w - 18, h - 25), fill=(*hex_rgb(accent), 185), width=5)
    pd.rectangle((20, h - 17, 88, h - 13), fill=(255, 255, 255, 130))
    pd.rectangle((20, h - 9, 64, h - 6), fill=(255, 255, 255, 90))

    canvas.paste(poster, (x, y), rounded_mask((w, h), 28))
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((x, y, x + w, y + h), radius=28, outline=rgba("#FFFFFF", 150), width=1)


def draw_progress(d, x, y, w, h, accent):
    gap = 8
    seg_w = (w - gap * 6) / 7
    for i in range(7):
        x0 = int(x + i * (seg_w + gap))
        x1 = int(x0 + seg_w)
        fill = rgba(accent, 255) if i == 0 else rgba("#E8E4DA", 255)
        d.rounded_rectangle((x0, y, x1, y + h), radius=h // 2, fill=fill)


def draw_icon(d, kind, cx, cy, color, muted=False):
    c = rgba(color, 255)
    w = 4
    if kind == "compass":
        d.ellipse((cx - 19, cy - 19, cx + 19, cy + 19), outline=c, width=w)
        d.polygon([(cx + 5, cy - 16), (cx - 5, cy + 6), (cx + 14, cy + 4)], fill=c)
    elif kind == "team":
        d.ellipse((cx - 18, cy - 17, cx - 2, cy - 1), outline=c, width=w)
        d.ellipse((cx + 5, cy - 18, cx + 21, cy - 2), outline=c, width=w)
        d.arc((cx - 30, cy + 0, cx + 8, cy + 34), 205, 335, fill=c, width=w)
        d.arc((cx - 4, cy + 0, cx + 34, cy + 34), 205, 335, fill=c, width=w)
    elif kind == "map":
        d.line((cx - 25, cy - 16, cx - 10, cy - 24, cx + 8, cy - 15, cx + 25, cy - 23), fill=c, width=w)
        d.line((cx - 25, cy + 18, cx - 10, cy + 10, cx + 8, cy + 20, cx + 25, cy + 12), fill=c, width=w)
        d.line((cx - 25, cy - 16, cx - 25, cy + 18), fill=c, width=w)
        d.line((cx - 10, cy - 24, cx - 10, cy + 10), fill=c, width=w)
        d.line((cx + 8, cy - 15, cx + 8, cy + 20), fill=c, width=w)
        d.line((cx + 25, cy - 23, cx + 25, cy + 12), fill=c, width=w)
    elif kind == "bolt":
        d.polygon([(cx + 2, cy - 27), (cx - 17, cy + 2), (cx - 2, cy + 2), (cx - 8, cy + 27), (cx + 17, cy - 7), (cx + 2, cy - 7)], fill=c)
    elif kind == "send":
        d.polygon([(cx - 15, cy - 12), (cx + 18, cy), (cx - 15, cy + 12), (cx - 8, cy), (cx - 15, cy - 12)], fill=rgba("#FFFFFF", 245))


def render(filename, accent, mode="color"):
    if mode == "lime":
        ink = "#101213"
        slate = "#2A3032"
        muted = "#72716B"
        tag_fill = "#17191A"
        tag_text = "#FAF9F5"
        icon_accent = ink
    elif mode == "terracotta":
        ink = "#252C35"
        slate = "#303846"
        muted = "#73736D"
        tag_fill = accent
        tag_text = "#FFFFFF"
        icon_accent = accent
    else:
        ink = "#171817"
        slate = "#33332F"
        muted = "#72716B"
        tag_fill = accent
        tag_text = "#FFFFFF"
        icon_accent = accent

    palette = {"ink": ink, "slate": slate, "muted": muted, "hair": "#E6E0D4"}
    canvas = Image.new("RGBA", (W, H), rgba("#FAF9F5", 255))
    d = ImageDraw.Draw(canvas)

    # A faint paper warmth, almost invisible but prevents pure flat white.
    warmth = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    wd = ImageDraw.Draw(warmth)
    for y in range(H):
        a = int(10 * (y / H))
        wd.line((0, y, W, y), fill=(246, 241, 231, a))
    canvas.alpha_composite(warmth)

    draw_header(canvas, palette)

    text(d, (64, 205), "早上好，继续冲刺", font(56), rgba(ink, 255))
    text(d, (66, 268), "距离提交还有 43 小时，把想法推进到可演示。", font(24), rgba(muted, 255))

    card = (64, 322, 960, 820)
    shadowed_round(canvas, card, 44, rgba("#FFFFFF", 248), outline=rgba("#E6E0D4", 210), shadow=True)
    d = ImageDraw.Draw(canvas)

    draw_thumbnail(canvas, 104, 370, 124, 124, accent)
    pill(d, (252, 360, 348, 398), fill=rgba(tag_fill, 255))
    text(d, (300, 386), "进行中", font(20), rgba(tag_text, 255), anchor="mm")

    text(d, (252, 422), "上海 AI 黑客松", font(46), rgba(ink, 255))
    text(d, (254, 478), "组队、路线与材料已同步到工作台", font(24), rgba(muted, 255))
    text(d, (812, 384), "43", latin(88), rgba(ink, 255), anchor="ma")
    text(d, (882, 406), "小时", font(22), rgba(muted, 255), anchor="la")
    text(d, (812, 462), "距提交", font(21), rgba(muted, 255), anchor="ma")

    draw_progress(d, 104, 552, 816, 18, accent)
    labels = ["报名", "组队", "选题", "原型", "路演", "提交", "复盘"]
    for i, label in enumerate(labels):
        x = 104 + i * (816 / 6)
        text(d, (x, 613), label, font(19), rgba(ink if i == 0 else muted, 255), anchor="ma")

    inset = (104, 652, 920, 740)
    d.rounded_rectangle(inset, radius=26, fill=rgba("#F6F3EC", 255), outline=rgba("#E8E1D4", 255), width=1)
    text(d, (130, 687), "下一步", font(20), rgba(muted, 255))
    text(d, (130, 724), "完善作品一句话价值主张", font(27), rgba(ink, 255))
    d.rounded_rectangle((760, 681, 894, 720), radius=19, fill=rgba("#FFFFFF", 220), outline=rgba("#E6E0D4", 220), width=1)
    text(d, (827, 707), "12:30 前", font(20), rgba(slate, 255), anchor="mm")

    text(d, (104, 782), "上海 · 6月22日-23日 · 奖池 ¥80,000", font(23), rgba(muted, 255))

    stats = [("队友", "3"), ("任务", "8"), ("材料", "12"), ("提醒", "2")]
    for i, (label, num) in enumerate(stats):
        x0 = 64 + i * 232
        x1 = x0 + 206
        y0, y1 = 858, 966
        d.rounded_rectangle((x0, y0, x1, y1), radius=28, fill=rgba("#FFFFFF", 230), outline=rgba("#E6E0D4", 220), width=1)
        text(d, (x0 + 28, y0 + 38), label, font(21), rgba(muted, 255))
        text(d, (x0 + 28, y0 + 74), num, latin(40), rgba(ink, 255))

    text(d, (64, 1040), "快捷入口", font(30), rgba(ink, 255))
    entries = [("compass", "找赛事"), ("team", "组队"), ("map", "路线"), ("bolt", "AI 助手")]
    for i, (kind, label) in enumerate(entries):
        x0 = 64 + i * 232
        y0 = 1094
        x1, y1 = x0 + 206, y0 + 164
        d.rounded_rectangle((x0, y0, x1, y1), radius=32, fill=rgba("#FFFFFF", 235), outline=rgba("#E6E0D4", 230), width=1)
        col = icon_accent if i == 0 else "#454640"
        draw_icon(d, kind, x0 + 103, y0 + 62, col)
        text(d, (x0 + 103, y0 + 129), label, font(23), rgba(slate, 255), anchor="ma")

    text(d, (64, 1320), "推荐 AI 动作", font(28), rgba(ink, 255))
    d.rounded_rectangle((64, 1362, 960, 1442), radius=40, fill=rgba("#F0EDE5", 255), outline=rgba("#E3DCCC", 255), width=1)
    text(d, (100, 1411), "生成 3 个路演开场版本，并匹配评委关注点", font(25), rgba(slate, 255), anchor="lm")

    # Floating command input.
    shadowed_round(canvas, (64, 1448, 960, 1520), 36, rgba("#FFFFFF", 252), outline=rgba("#E5DED2", 235), shadow=True)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((94, 1468, 210, 1504), radius=18, fill=rgba("#F4F1EA", 255), outline=rgba("#E4DDD0", 255), width=1)
    text(d, (152, 1492), "当前赛事", font(18), rgba(muted, 255), anchor="mm")
    text(d, (232, 1491), "问 HackerTrip 下一步做什么", font(24), rgba("#9A958C", 255), anchor="lm")
    d.ellipse((876, 1458, 940, 1522), fill=rgba(accent, 255))
    draw_icon(d, "send", 908, 1490, "#FFFFFF")

    # Keep exact requested output size.
    canvas.convert("RGB").save(OUT / filename, quality=96)


if __name__ == "__main__":
    render("home-pine.png", "#1E7A5A")
    render("home-terracotta.png", "#C2562F", mode="terracotta")
    render("home-ink-lime.png", "#C8FF3D", mode="lime")
    render("home-cobalt.png", "#1B3FA0")
