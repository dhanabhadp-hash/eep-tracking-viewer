#!/usr/bin/env python3
"""Regenerate the PWA PNG icons (public/icons/icon-192.png, icon-512.png).

The PNG files are generated (not committed to git) — run this once after cloning:

    pip install pillow
    python3 scripts/make-icons.py
"""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")


def make_icon(size: int, path: str) -> None:
    img = Image.new("RGB", (size, size), "#0284c7")
    d = ImageDraw.Draw(img)
    r = int(size * 0.18)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill="#0284c7")
    cx, cy = size // 2, size // 2
    bar_w, bar_h = int(size * 0.62), int(size * 0.20)
    d.rounded_rectangle(
        [cx - bar_w // 2, cy - bar_h // 2, cx + bar_w // 2, cy + bar_h // 2],
        radius=bar_h // 2,
        fill="white",
    )
    d.rounded_rectangle(
        [cx - bar_h // 2, cy - bar_w // 2, cx + bar_h // 2, cy + bar_w // 2],
        radius=bar_h // 2,
        fill="white",
    )
    d.pieslice(
        [cx - bar_w // 2, cy - bar_h // 2, cx + bar_w // 2, cy + bar_h // 2],
        90,
        270,
        fill="#e0f2fe",
    )
    img.save(path)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_icon(192, os.path.join(OUT, "icon-192.png"))
    make_icon(512, os.path.join(OUT, "icon-512.png"))
    print("icons written to", OUT)
