import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

OUT = Path("docs/entregas/play-store")
ASSETS = Path("apps/client/public/assets/art")
FONTS = Path("apps/client/public/fonts")
OUT.mkdir(parents=True, exist_ok=True)

icon = Image.open("apps/client/public/icons/boliche-512.png").convert("RGBA")
icon.save(OUT / "icono-512.png", optimize=True)
wall = Image.open(ASSETS / "wall.webp").convert("RGB")
image = ImageEnhance.Brightness(ImageOps.fit(wall, (1024, 500), centering=(.67, .5))).enhance(.64).convert("RGBA")
shade = Image.new("RGBA", image.size)
shade_draw = ImageDraw.Draw(shade)
for x in range(1024):
    a = max(0, int(226 - x * .36))
    shade_draw.line((x, 0, x, 500), fill=(25, 29, 22, a))
image.alpha_composite(shade)
draw = ImageDraw.Draw(image)
draw.line((765, 0, 765, 45), fill="#2b231c", width=5)
draw.ellipse((704, 37, 826, 67), fill="#4f3526", outline="#211e1a", width=5)
draw.ellipse((720, 48, 810, 66), fill="#f2c56e")
draw.ellipse((751, 49, 779, 73), fill="#fff1b4")
for name, pos, size in [("washington-base-preview.webp", (552, 98), 241), ("marta-base-preview.webp", (750, 126), 226)]:
    character = Image.open(ASSETS / name).convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
    image.alpha_composite(character, pos)
draw = ImageDraw.Draw(image)
draw.ellipse((520, 302, 1120, 612), fill="#9b663d", outline="#2d211a", width=8)
draw.ellipse((546, 323, 1094, 599), outline="#bd8950", width=2)
for x in range(565, 1040, 58):
    y = int(321 + 45 * ((x - 815) / 250) ** 2)
    draw.line((x, y, x - 7, 500), fill="#7e542f", width=2)
atlas = Image.open(ASSETS / "cards-classica@1x.png").convert("RGBA")
frames = json.loads((ASSETS / "cards-classica@1x.json").read_text(encoding="utf-8"))["frames"]
for card, pos, degrees in [("7O", (664, 355), 19), ("2E", (733, 333), 3), ("1B", (801, 355), -17)]:
    f = frames[f"classica-{card}.png"]["frame"]
    face = atlas.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
    face = face.resize((68, 99), Image.Resampling.LANCZOS).rotate(degrees, expand=True, resample=Image.Resampling.BICUBIC)
    image.alpha_composite(face, pos)
draw = ImageDraw.Draw(image)
draw.ellipse((943, 373, 1001, 432), fill="#64412b", outline="#29221a", width=4)
draw.ellipse((943, 371, 1001, 388), fill="#89935c", outline="#cfb483", width=3)
draw.line((975, 374, 990, 338), fill="#d5c8a5", width=5)
draw.rounded_rectangle((58, 91, 264, 128), 16, fill="#263c31", outline="#a08b54", width=1)
nunito = ImageFont.truetype(str(FONTS / "Nunito.ttf"), 18)
heading = ImageFont.truetype(str(FONTS / "LilitaOne.ttf"), 94)
accent = ImageFont.truetype(str(FONTS / "LilitaOne.ttf"), 107)
tagline = ImageFont.truetype(str(FONTS / "Nunito.ttf"), 26)
draw.text((76, 98), "TRUCO URUGUAYO", fill="#f3d297", font=nunito)
draw.text((55, 138), "Truco de", fill="#fff0cd", font=heading, stroke_width=2, stroke_fill="#2d241a")
draw.text((49, 225), "Boliche", fill="#efbf68", font=accent, stroke_width=2, stroke_fill="#2d241a")
draw.rounded_rectangle((59, 350, 422, 356), 3, fill="#b67148")
draw.text((57, 380), "Una mesa. Un mate.", fill="#fae4bd", font=tagline)
draw.text((57, 416), "Una buena partida.", fill="#fae4bd", font=tagline)
image.convert("RGB").save(OUT / "imagen-destacada-1024x500.png", optimize=True)
