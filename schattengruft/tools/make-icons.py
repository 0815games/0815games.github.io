#!/usr/bin/env python3
"""Erzeugt das App-Icon-Set fuer 'Chroniken der Schattengruft'.

Design: dunkler Grund (Theme-Farbe #08090e), oben eine flammende Fackel
(Gold -> Rot, verwandt mit der alten Favicon-Palette) auf einem steinernen
Rundschild. Alle Formen werden in Normalisiert-Koordinaten gezeichnet und
auf die Zielgroesse skaliert, damit das Icon in jeder Groesse sauber wirkt.

Ausgabe (alle in assets/icons/):
  favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png,
  icon-512.png, icon-512-maskable.png, og-image.png, og-image.jpg

Usage:  python3 tools/make-icons.py
Depends: Pillow (pip install Pillow)
"""
import math
import os
import struct
import zlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "icons")

BG = (8, 9, 14)          # #08090e, theme-color (Favicon / OG-Bild)
BG_DEEP = (4, 5, 8)
GOLD = (212, 160, 60)    # wie altes Favicon
GOLD_HI = (242, 205, 110)
RED = (214, 48, 40)
RED_HI = (240, 96, 64)
STONE = (30, 32, 40)
STONE_HI = (52, 56, 68)

# Heim-Screen-Icons (apple-touch-icon, manifest-PNGs): iOS zeigt Icons ohne
# Transparenz auf dem Homescreen. Ein dunkler Grund verschwindet dort und
# wirkt wie das iOS-Standard-Icon – deshalb heller, warmer Stein-Ton mit
# dem goldenen Logo, gut sichtbar auf hellen und dunklen Hintergrunden.
LIGHT_BG = (230, 216, 190)
LIGHT_BG_DEEP = (214, 196, 164)


# --------------------------------------------------------------------------- Formen

def flame_points(cx, base_y, w, h, n=64):
    """Eine Fackelflamme als Polygon: spitze oben, zur Basis hin breiter."""
    pts = [(cx, base_y - h)]
    for i in range(n // 2):
        t = (i + 1) / (n // 2)
        x = math.sin(t * math.pi) ** 0.85 * (w * 0.5)
        y = base_y - h + t * h
        pts.append((cx + x, y))
    for i in range(n // 2, n - 1):
        t = (i + 1) / (n - 1)
        x = math.sin(t * math.pi) ** 0.85 * (w * 0.5)
        y = base_y - h + t * h
        pts.append((cx - x, y))
    pts.append((cx, base_y - h))
    return pts


def draw_icon(size, maskable=False, light=False):
    """Zeit das Icon in der Groesse `size`. Gemaeßlicher Goldring mit Flamme.

    `light` wählt den hellen, warmen Grund (Heim-Screen-Icons: iOS zeigt
    keine Transparenz, ein dunkler Grund wirkt wie das Standard-Icon).
    Der dunkle Grund bleibt für Favicon und OG-Bild.
    """
    bg = LIGHT_BG if light else BG
    bg_deep = LIGHT_BG_DEEP if light else BG_DEEP
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2

    # Grund: voller Quadrat mit radialer Schachtelung (Dunkel -> etwas heller Mitte)
    d.rectangle([0, 0, size, size], fill=bg)
    vg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vg)
    grad = Image.linear_gradient("L").resize((size, size))
    tone = Image.new("RGBA", (size, size), bg_deep)
    tone.paste(bg, (0, 0), grad.point(lambda v: int(v * 0.8)))
    vg.paste(tone, (0, 0))
    img.alpha_composite(vg)

    # Masken-Sicherheitszone: Inhalt nur in den mittleren 80% fuer maskable
    margin = 0.10 if maskable else 0.05
    sw = size * (1 - 2 * margin)

    # --- Zwei goldne Ringe (Dungeon-Tor-Motiv) -------------------------------
    r_out = sw * 0.50
    r_in = sw * 0.42
    sw_out = max(2, size // 90)
    sw_in = max(1, size // 140)
    d.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out],
              outline=GOLD, width=sw_out)
    d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in],
              outline=GOLD_HI, width=sw_in)

    # --- Fackelschaft (kurz, breit) -------------------------------------------
    shaft_w = sw * 0.10
    shaft_h = sw * 0.22
    base_y = cy + sw * 0.24
    d.rounded_rectangle([cx - shaft_w / 2, base_y, cx + shaft_w / 2,
                         base_y + shaft_h], radius=shaft_w * 0.35,
                        fill=(34, 24, 16), outline=GOLD, width=max(1, size // 256))

    # --- Flamme mit Farbverlauf: aussen ROTT, innen GELB -----------------------
    flame_h = sw * 0.55
    flame_w = sw * 0.30
    pts = flame_points(cx, base_y, flame_w, flame_h)
    poly = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pd = ImageDraw.Draw(poly)
    pd.polygon(pts, fill=RED)
    inner_w = flame_w * 0.52
    inner_h = flame_h * 0.82
    pd.polygon(flame_points(cx, base_y, inner_w, inner_h), fill=GOLD)
    core_w = flame_w * 0.24
    core_h = flame_h * 0.58
    pd.polygon(flame_points(cx, base_y, core_w, core_h), fill=GOLD_HI)

    # Glow: weiches Leuchten um die Flamme
    glow = poly.filter(ImageFilter.GaussianBlur(size * 0.03))
    img.alpha_composite(glow)
    img.alpha_composite(poly)

    # goldner Rand am Quadratrand (nur ohne maskable-Sicherheitszone)
    if not maskable:
        d.rectangle([size // 24, size // 24, size - size // 24,
                     size - size // 24], outline=GOLD,
                    width=max(1, size // 220))

    return img  # RGBA: alpha wird erst beim Speichern abgegeben


# --------------------------------------------------------------------------- SVG

def svg_icon():
    """SVG-Version des Icons (Vektor, fuer Browser-Favicon)."""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#141620"/>
      <stop offset="70%" stop-color="#08090e"/>
      <stop offset="100%" stop-color="#040508"/>
    </radialGradient>
    <linearGradient id="flame" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="{_rgb(RED)}"/>
      <stop offset="65%" stop-color="{_rgb(GOLD)}"/>
      <stop offset="100%" stop-color="{_rgb(GOLD_HI)}"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg)"/>
  <rect x="4" y="4" width="92" height="92" fill="none"
        stroke="{_rgb(GOLD)}" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="{_rgb(GOLD)}" stroke-width="6"/>
  <circle cx="50" cy="50" r="33" fill="none" stroke="{_rgb(GOLD_HI)}" stroke-width="2"/>
  <rect x="45" y="68" width="10" height="14" rx="3" fill="#22180e"
        stroke="{_rgb(GOLD)}" stroke-width="1.5"/>
  <path d="M50 14 C 41 30 30 40 30 55 C 30 64 37 68 50 68
           C 63 68 70 64 70 55 C 70 40 59 30 50 14 Z" fill="url(#flame)"/>
  <path d="M50 22 C 45 34 41 42 41 55 C 41 62 45 65 50 65
           C 55 65 59 62 59 55 C 59 42 55 34 50 22 Z" fill="{_rgb(GOLD_HI)}"/>
</svg>
'''


def _rgb(c):
    return "#%02x%02x%02x" % c


# --------------------------------------------------------------------------- OG-Image

def og_image(w=1200, h=630):
    """Share-Bild: Titel + Icon-Motiv im Dunkeln."""
    img = Image.new("RGBA", (w, h), BG_DEEP)
    d = ImageDraw.Draw(img)
    # Vertikalverlauf
    grad = Image.linear_gradient("L").resize((w, h))
    tone = Image.new("RGBA", (w, h), BG_DEEP)
    tone.paste(BG, (0, 0), grad.point(lambda v: int(v * 0.9)))
    img.alpha_composite(tone)

    # Grosses Flammen-Motiv links
    icon = draw_icon(h)
    # entferne den Rahmen-Kreis für die Groesse, nur Fackel brauchen wir
    icon = icon.filter(ImageFilter.GaussianBlur(h * 0.008))
    img.paste(icon, (int(w * 0.10), 0), icon)

    # Titel
    title_font = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(h * 0.115))
    sub_font = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", int(h * 0.045))
    tx = int(w * 0.44)
    title = "CHRONIKEN DER"
    d.text((tx, int(h * 0.30)), title, font=title_font, fill=STONE_HI)
    d.text((tx, int(h * 0.42)), "SCHATTENGRUFT", font=title_font, fill=GOLD)
    d.text((tx, int(h * 0.62)), "Dungeon-Roguelike mit Cloud-Saves",
           font=sub_font, fill=(150, 158, 172))
    # Trennlinie
    d.rectangle([tx, int(h * 0.60), tx + int(w * 0.28), int(h * 0.608)],
                fill=GOLD)
    return img.convert("RGB")


# --------------------------------------------------------------------------- ICO

def write_ico(path, png_img, sizes=(16, 32, 48, 64)):
    """Multisize-ICO aus PNG-Daten (PIL schreibt ICO; wir assemblieren manuell)."""
    # PIL kann ICO direkt schreiben mit mehreren Groessen
    png_img.save(path, format="ICO",
                 sizes=[(s, s) for s in sizes])


# --------------------------------------------------------------------------- Hauptprogramm

def main():
    os.makedirs(OUT, exist_ok=True)

    # SVG
    with open(os.path.join(OUT, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_icon())

    # PNGs (Home-Screen-Icons: heller Grund, sonst wirkt das dunkle Logo
    # auf dem iOS-Homescreen wie das Standard-Icon)
    img192 = draw_icon(192, light=True)
    img512 = draw_icon(512, light=True)
    img512.save(os.path.join(OUT, "icon-512.png"))
    img192.save(os.path.join(OUT, "icon-192.png"))

    img_mask = draw_icon(512, maskable=True, light=True)
    img_mask.save(os.path.join(OUT, "icon-512-maskable.png"))

    apple = draw_icon(180, light=True)
    apple.save(os.path.join(OUT, "apple-touch-icon.png"))

    # ICO: von 512-Version rasterisieren (dunkel, wie Favicon)
    write_ico(os.path.join(OUT, "favicon.ico"), draw_icon(512).convert("RGB"),
              sizes=(16, 32, 48, 64))

    # OG-Image
    og = og_image(1200, 630)
    og.save(os.path.join(OUT, "og-image.png"), optimize=True)
    og.save(os.path.join(OUT, "og-image.jpg"), quality=88)

    for name in sorted(os.listdir(OUT)):
        p = os.path.join(OUT, name)
        print(f"{name:28s} {os.path.getsize(p):>8d} Bytes")


if __name__ == "__main__":
    main()
