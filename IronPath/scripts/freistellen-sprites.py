#!/usr/bin/env python3
"""Weiß -> Alpha Freistellung fuer deko-/karten-sprites (IPL-0130).

Aufruf:  python3 scripts/freistellen-sprites.py 'IronPath/preview-sprites/*-new.png'

Pipeline je Bild:
  1. Wachsende Hintergrund-Maske ab allen Kanten (neutral-hell, Luma > 206):
     frisst den eingemalten weissen Schatten samt Gradient, stoppt an der
     dunklen Tusche-Kontur und an gesaettigten Flaechen.
  2. Globaler Neutral-Hell-Pass: helle, unsaettigte Restflaechen (z.B. das
     weisse Fensterloch einer Ruine) werden auch ohne Randkontakt entfernt.
  3. Rand-Halo-Reinigung (near-white opak an Transparenz -> transparent).
  4. Crop auf die Bounding-Box; die Fusslinie bleibt Bild-Unterkante
     (drawDeco verankert den Sprite per Unterkante).

Ausgabe: <name>-cut.png neben der Eingabe. Benoetigt pillow + numpy.
"""
import glob
import os
import sys

import numpy as np
from PIL import Image


def cutout(path: str) -> Image.Image:
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    mn = a.min(2)
    mx = a.max(2)
    luma = a.mean(2)
    neutral = (mx - mn) < 48

    bg = np.zeros((h, w), bool)
    for edge in (0, h - 1):
        bg[edge, :] = (luma[edge, :] > 228) & neutral[edge, :]
    for edge in (0, w - 1):
        bg[:, edge] = (luma[:, edge] > 228) & neutral[:, edge]

    for _ in range(w + h):
        grow = np.zeros_like(bg)
        grow[1:, :] |= bg[:-1, :]
        grow[:-1, :] |= bg[1:, :]
        grow[:, 1:] |= bg[:, :-1]
        grow[:, :-1] |= bg[:, 1:]
        nxt = bg | (grow & (luma > 206) & neutral)
        if nxt.sum() == bg.sum():
            break
        bg = nxt

    # shadow-ring pass: the baked contact shadow survives as a pale neutral
    # ring (luma ~150-185) hugging the crop edge. Grow from the transparent
    # border into pale-neutral pixels; the ink outline stops the growth at
    # the plinth and protects everything inside the silhouette.
    for _ in range(w + h):
        touch = np.zeros((h, w), bool)
        trans = ~bg
        touch[1:, :] |= trans[:-1, :]
        touch[:-1, :] |= trans[1:, :]
        touch[:, 1:] |= trans[:, :-1]
        touch[:, :-1] |= trans[:, 1:]
        nxt = bg | (touch & neutral & (luma > 150))
        if nxt.sum() == bg.sum():
            break
        bg = nxt

    bg |= (luma > 206) & neutral
    alpha = np.where(bg, 0, 255).astype(np.uint8)

    for _ in range(2):
        edge = np.zeros((h, w), bool)
        edge[1:, :] |= bg[:-1, :]
        edge[:-1, :] |= bg[1:, :]
        edge[:, 1:] |= bg[:, :-1]
        edge[:, :-1] |= bg[:, 1:]
        halo = (alpha > 0) & (mn > 236) & (edge | bg)
        if not halo.any():
            break
        alpha[halo] = 0
        bg |= halo

    img = Image.fromarray(np.dstack([np.asarray(im), alpha]), 'RGBA')
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    paths = sorted(glob.glob(sys.argv[1]))
    if not paths:
        print(f'keine treffer fuer {sys.argv[1]!r}')
        return 1
    for path in paths:
        out = path.replace('-new', '-cut')
        img = cutout(path)
        img.save(out)
        arr = np.asarray(img)
        alpha = arr[..., 3]
        print(
            f'{os.path.basename(out)} {img.size} '
            f'opaque={(alpha > 250).sum()} partial={((alpha > 0) & (alpha < 250)).sum()}'
        )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
