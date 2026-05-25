import base64
import os
import urllib.request
from pathlib import Path

import openai


OUTPUT_DIR = Path("/Users/jaydenworkplace/Desktop/hacker_trip/generated_images")
ENV_PATH = Path("/Users/jaydenworkplace/Desktop/hacker_trip/.env.local")

MODEL = "gpt-image-1"
SIZE = "1536x1024"
QUALITY = "high"

SHARED_CARD_CONTENT = """
Exact front-face content checklist. Do not omit these elements. All four tier cards must use this same data layout and hierarchy. Render every marking as physically attached to the card surface and following the same card perspective:
- Top header text: VIBERCARD
- Level badge text: {level}
- Profile name text: Jayden Huang
- Handle text: @jayden72
- Badge text: AI BUILDER
- Four stat values shown together on one clear line or four small stat boxes: 7 / 5 / 12 / 87
- DAMC section: four separate horizontal progress bars in purple, pink, cyan, and rose, near the stat values
- Token count text: 12.8M tokens, glowing bright cyan
- Tech tag row text: React TypeScript Next.js Solidity Python
- Serial text near the bottom edge: HT-7C5D-0072
- Glowing HUD corner brackets on all four corners
"""

BASE_PROMPT = """
Create a photorealistic premium product render of ViberCard, a physical solid metal identity card floating in dark space.

Shared 3D and composition requirements:
- REAL 3D DEPTH: the card must look like a tangible physical 3D object floating in space, not a flat 2D graphic, UI screenshot, poster, or illustration.
- THICK CARD EDGE: show a clearly visible 2-3mm solid metal slab edge with beveled chamfer, darker side face, and reflected rim highlights along the edge.
- TILTED CARD: card tilted about 20 degrees in 3D space, with both the front face and the thick metal edge visible.
- MATERIAL REALISM: metallic reflections, subtle micro-scratches, physically plausible specular response, and realistic shadows/occlusion on the card edges.
- DEPTH OF FIELD: cinematic lens rendering with slight background bokeh and subtle edge falloff to increase the 3D feeling.

Composition constraints:
- Landscape 1536x1024 product-shot composition with generous dark negative space around the floating card.
- Background must stay dark #05060a, with no scenery, no table, no hands, no wallet, no extra objects, and no payment-card branding.
- Keep the card content readable and attached to the card surface, following the perspective of the physical card.
- Preserve the full content checklist. Do not replace the stats with only bars, and do not drop the serial, tech tags, or token count.
- Premium AI-builder collector-card aesthetic with HUD corner brackets, precise layout, and exact readable text.
"""


TIERS = [
    {
        "filename": "vibecard_bronze.png",
        "name": "BRONZE",
        "level": "Lv.10",
        "tier_prompt": """
Tier identity: BRONZE, Lv.10.
Material: aged brushed bronze/copper metal, warm patina in grooves and around edges, subtle oxidation, fine linear brushing, solid heavy metal slab.
Color palette: warm copper #CD7F32 as the dominant metal, burnt orange accents, dark brown shadows, muted amber highlights.
Lighting: warm amber key light across the face, subtle orange rim light tracing the 2-3mm beveled edge, soft dark-brown occlusion on the side face.
Engraving style: pressed/stamped text and HUD markings recessed into the bronze surface, darkened in the stamped grooves, with restrained orange glow only on progress bars and HUD details.
Feel: rustic, solid, entry-level warrior, durable and battle-worn but premium.
""",
    },
    {
        "filename": "vibecard_gold.png",
        "name": "GOLD",
        "level": "Lv.25",
        "tier_prompt": """
Tier identity: GOLD, Lv.25.
Material: polished 24K gold, mirror-like reflective metal face, crisp beveled gold slab edge, clean sharp chamfers, luxurious specular polish.
Color palette: rich gold #FFD700 as the dominant metal, warm yellow highlights, deep amber shadows, small bright white glints on the polished edge.
Lighting: bright warm golden glow, strong specular highlights showing mirror polish, radiant amber reflections on the side face and bevel.
Text style: embossed gold lettering with sharp raised edges catching highlights, premium raised HUD markings, progress bars and token count glowing through the polished gold surface.
Feel: prestigious, luxurious, achievement unlocked, ceremonial and high-value.
""",
    },
    {
        "filename": "vibecard_platinum.png",
        "name": "PLATINUM",
        "level": "Lv.50",
        "tier_prompt": """
Tier identity: PLATINUM, Lv.50.
Material: brushed platinum/white gold, cool silver metal with blue undertones, fine anisotropic brushing, precise machined bevels, understated high-end finish.
Color palette: cool silver #E5E4E2 as the dominant metal, ice blue #4de1ff accents, steel gray shadows, clean white-blue highlights.
Lighting: cool blue-white rim lights, clean crisp reflections, subtle icy fill light across the face, sharp edge highlights that reveal the 2-3mm metal thickness.
Text style: laser-etched precision typography and HUD markings cut into the platinum surface, fine bright cyan etched lines, technical and exact.
Feel: elite, technical precision, understated power, clean engineering-grade prestige.
""",
    },
    {
        "filename": "vibecard_diamond.png",
        "name": "DIAMOND",
        "level": "Lv.99",
        "tier_prompt": """
Tier identity: DIAMOND, Lv.99.
Material: dark titanium base with holographic prismatic/rainbow refractions, glossy dark metal slab, crystalline sparkle points on bevels, subtle transparent prism-like dispersion over the surface.
Color palette: dark titanium base with shifting rainbow holographic gradients #7c5dff to #c759ff to #4de1ff to #ff6b9d, high contrast neon accents, deep black shadows.
Lighting: dramatic multi-color rim lights from multiple directions, prismatic light dispersion effects, crystal sparkle, rainbow caustic streaks crossing the 2-3mm edge.
Text style: glowing neon holographic text and HUD markings, intense shifting-color corner brackets, luminous token count and tier badge, readable but otherworldly.
Feel: legendary, otherworldly, maximum prestige, rare endgame artifact.
""",
    },
]


def build_prompt(tier):
    return (
        f"{BASE_PROMPT}\n"
        f"{SHARED_CARD_CONTENT.format(level=tier['level'])}\n"
        f"{tier['tier_prompt']}\n"
        "Important tier separation: this image must visually read as this exact tier only, with a completely different metal material and palette from the other tiers. "
        "Do not make all tiers look like the same titanium card with different accent colors.\n"
        "Render quality: ultra-detailed, photorealistic, cinematic product photography, realistic metal shader, high dynamic range lighting, no watermark."
    )


def save_image(image, output_path):
    b64_json = getattr(image, "b64_json", None)
    url = getattr(image, "url", None)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if b64_json:
        output_path.write_bytes(base64.b64decode(b64_json))
        return

    if url:
        with urllib.request.urlopen(url) as response:
            output_path.write_bytes(response.read())
        return

    raise RuntimeError("No image data returned by the API.")


def generate_image(client, prompt):
    return client.images.generate(
        model=MODEL,
        prompt=prompt,
        size=SIZE,
        quality=QUALITY,
        output_format="png",
    )


def load_openai_api_key():
    if os.environ.get("OPENAI_API_KEY"):
        return

    if not ENV_PATH.exists():
        return

    for line in ENV_PATH.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)
        if key.strip() != "OPENAI_API_KEY":
            continue

        value = value.strip().strip("\"'")
        if value:
            os.environ["OPENAI_API_KEY"] = value
        return


def main():
    load_openai_api_key()

    if not os.environ.get("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

    client = openai.OpenAI()

    for index, tier in enumerate(TIERS, start=1):
        output_path = OUTPUT_DIR / tier["filename"]
        print(
            f"[{index}/{len(TIERS)}] Generating {tier['name']} {tier['level']} -> {output_path}",
            flush=True,
        )

        response = generate_image(client, build_prompt(tier))
        if not response.data:
            raise RuntimeError(f"No images returned by the API for {tier['filename']}.")

        save_image(response.data[0], output_path)
        print(f"[{index}/{len(TIERS)}] Saved {output_path}", flush=True)

    print("Generated all 4 tier-based ViberCard images successfully.")


if __name__ == "__main__":
    main()
