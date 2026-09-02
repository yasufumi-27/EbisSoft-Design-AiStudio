#!/usr/bin/env python3
"""Generate an R8 base mesh with Tencent Hunyuan3D-2mv on Apple Silicon."""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import torch
from PIL import Image

from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--views", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--steps", type=int, default=30)
    parser.add_argument("--resolution", type=int, default=256)
    parser.add_argument("--chunks", type=int, default=8000)
    parser.add_argument("--seed", type=int, default=5200)
    parser.add_argument("--device", default="mps")
    args = parser.parse_args()

    if args.device == "mps" and not torch.backends.mps.is_available():
        raise RuntimeError("Apple MPS is unavailable; use --device cpu as a fallback")

    images = {
        key: Image.open(args.views / f"{key}.png").convert("RGBA")
        for key in ("front", "left", "back", "right")
    }

    started = time.time()
    print(f"Loading Hunyuan3D-2mv on {args.device}…", flush=True)
    pipeline = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
        "tencent/Hunyuan3D-2mv",
        subfolder="hunyuan3d-dit-v2-mv",
        variant="fp16",
        device=args.device,
        dtype=torch.float16,
    )

    generator = torch.Generator(device="cpu").manual_seed(args.seed)
    print("Generating multiview base mesh…", flush=True)
    mesh = pipeline(
        image=images,
        num_inference_steps=args.steps,
        octree_resolution=args.resolution,
        num_chunks=args.chunks,
        generator=generator,
        output_type="trimesh",
    )[0]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(args.output)
    metadata = {
        "generator": "Tencent Hunyuan3D-2mv",
        "model": "tencent/Hunyuan3D-2mv/hunyuan3d-dit-v2-mv",
        "device": args.device,
        "steps": args.steps,
        "octree_resolution": args.resolution,
        "seed": args.seed,
        "elapsed_seconds": round(time.time() - started, 2),
        "vertices": int(len(mesh.vertices)),
        "faces": int(len(mesh.faces)),
        "source_views": [str(args.views / f"{key}.png") for key in images],
    }
    args.output.with_suffix(".json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(metadata, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
