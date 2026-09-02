"""Import and normalize the licensed Type 42 source before Spyder conversion."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
PIPELINE = ROOT / "tools" / "blender" / "r8_type42"
SOURCE = PIPELINE / "source"
WORK = PIPELINE / "work"
TARGET = json.loads((PIPELINE / "target.json").read_text(encoding="utf-8"))
SUPPORTED = {".glb", ".gltf", ".fbx", ".obj"}


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.images, bpy.data.curves):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def locate_source() -> Path:
    candidates = sorted(
        path for path in SOURCE.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED
    )
    if not candidates:
        raise FileNotFoundError(
            "No .glb/.gltf/.fbx/.obj source found. Extract the Sketchfab download under "
            f"{SOURCE}"
        )
    preferred = [path for path in candidates if path.suffix.lower() in {".glb", ".gltf"}]
    return preferred[0] if preferred else candidates[0]


def import_source(path: Path) -> None:
    suffix = path.suffix.lower()
    if suffix in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    elif suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(path))
    elif suffix == ".obj":
        bpy.ops.wm.obj_import(filepath=str(path))


def world_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    return (
        Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points))),
        Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points))),
    )


def normalize_scale(meshes: list[bpy.types.Object]) -> float:
    lower, upper = world_bounds(meshes)
    spans = upper - lower
    longest = max(spans)
    factor = TARGET["dimensions_m"]["length"] / longest
    for obj in bpy.context.scene.objects:
        obj.scale *= factor
    bpy.context.view_layer.update()
    lower, upper = world_bounds(meshes)
    center = (lower + upper) * 0.5
    floor_offset = Vector((-center.x, -center.y, -lower.z))
    for obj in bpy.context.scene.objects:
        obj.location += floor_offset
    bpy.context.view_layer.update()
    return factor


def audit(source_path: Path, meshes: list[bpy.types.Object], scale_factor: float) -> dict:
    lower, upper = world_bounds(meshes)
    materials = sorted({slot.material.name for obj in meshes for slot in obj.material_slots if slot.material})
    return {
        "source": str(source_path),
        "scale_factor": scale_factor,
        "bounds_m": {"min": list(lower), "max": list(upper), "span": list(upper - lower)},
        "mesh_objects": [
            {
                "name": obj.name,
                "vertices": len(obj.data.vertices),
                "polygons": len(obj.data.polygons),
                "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            }
            for obj in sorted(meshes, key=lambda item: item.name.lower())
        ],
        "materials": materials,
        "totals": {
            "objects": len(meshes),
            "vertices": sum(len(obj.data.vertices) for obj in meshes),
            "polygons": sum(len(obj.data.polygons) for obj in meshes),
        },
    }


def main() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    source_path = locate_source()
    reset_scene()
    import_source(source_path)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"Imported source contains no mesh objects: {source_path}")
    scale_factor = normalize_scale(meshes)
    report = audit(source_path, meshes, scale_factor)
    (WORK / "source-audit.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    bpy.context.scene["source_attribution"] = (
        "Audi R8 V10 (Type 42) by Mona x Supercars / Car2022, CC BY 4.0"
    )
    bpy.context.scene["source_url"] = TARGET["source_model"]["url"]
    bpy.ops.wm.save_as_mainfile(filepath=str(WORK / "r8-type42-source-audit.blend"))
    print(json.dumps(report["totals"], ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"R8_IMPORT_ERROR: {error}", file=sys.stderr)
        raise SystemExit(1) from error
