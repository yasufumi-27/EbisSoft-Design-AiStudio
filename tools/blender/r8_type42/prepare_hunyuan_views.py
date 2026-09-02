#!/usr/bin/env python3
"""Split the R8 turntable sprite and prepare transparent Hunyuan3D-2mv inputs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image
from hy3dgen.rembg import BackgroundRemover


VIEW_NAMES = (
    "front",
    "front-right",
    "right",
    "rear-right",
    "back",
    "rear-left",
    "left",
    "front-left",
)

# Hunyuan's `left` example shows the subject facing image-left. That matches
# the sprite's right-side profile. The opposite profile maps to `right`.
HUNYUAN_VIEWS = {
    "front": "front",
    "left": "right",
    "back": "back",
    "right": "left",
}


def split_sprite(sprite: Image.Image) -> dict[str, Image.Image]:
    width, height = sprite.size
    result: dict[str, Image.Image] = {}
    for index, name in enumerate(VIEW_NAMES):
        col = index % 4
        row = index // 4
        x0 = round(col * width / 4)
        x1 = round((col + 1) * width / 4)
        y0 = round(row * height / 2)
        y1 = round((row + 1) * height / 2)
        result[name] = sprite.crop((x0, y0, x1, y1)).convert("RGBA")
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sprite", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    raw_dir = args.output / "raw"
    rgba_dir = args.output / "rgba"
    mv_dir = args.output / "hunyuan-mv"
    for directory in (raw_dir, rgba_dir, mv_dir):
        directory.mkdir(parents=True, exist_ok=True)

    frames = split_sprite(Image.open(args.sprite))
    remover = BackgroundRemover()
    manifest: dict[str, object] = {
        "source": str(args.sprite.resolve()),
        "sprite_order": list(VIEW_NAMES),
        "hunyuan_mapping": HUNYUAN_VIEWS,
        "views": {},
    }

    for name, frame in frames.items():
        raw_path = raw_dir / f"{name}.png"
        rgba_path = rgba_dir / f"{name}.png"
        frame.save(raw_path)
        isolated = remover(frame.convert("RGB")).convert("RGBA")
        isolated.save(rgba_path)
        manifest["views"][name] = {
            "raw": str(raw_path),
            "rgba": str(rgba_path),
            "size": list(isolated.size),
        }

    for model_key, source_name in HUNYUAN_VIEWS.items():
        frames[source_name] = Image.open(rgba_dir / f"{source_name}.png")
        frames[source_name].save(mv_dir / f"{model_key}.png")

    (args.output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Prepared 8 isolated views and 4 Hunyuan views in {args.output}")


if __name__ == "__main__":
    main()
