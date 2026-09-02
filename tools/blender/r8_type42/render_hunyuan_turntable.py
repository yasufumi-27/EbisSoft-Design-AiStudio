"""Normalize and render the raw Hunyuan multiview mesh for eight-view QA."""

from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
PIPELINE = ROOT / "tools" / "blender" / "r8_type42"
WORK = PIPELINE / "work"
SOURCE = WORK / "r8-hunyuan-base-256.glb"
TARGET = json.loads((PIPELINE / "target.json").read_text(encoding="utf-8"))
DIMENSIONS = TARGET["dimensions_m"]
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


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def joined_mesh() -> bpy.types.Object:
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"No meshes imported from {SOURCE}")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = "R8_Hunyuan_RawBody"
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj


def normalize_axes_and_size(obj: bpy.types.Object) -> dict[str, object]:
    coords = [vertex.co.copy() for vertex in obj.data.vertices]
    mins = [min(co[i] for co in coords) for i in range(3)]
    maxs = [max(co[i] for co in coords) for i in range(3)]
    extents = [maxs[i] - mins[i] for i in range(3)]
    length_axis, width_axis, height_axis = sorted(range(3), key=extents.__getitem__, reverse=True)

    remapped = [Vector((co[length_axis], co[width_axis], co[height_axis])) for co in coords]
    new_mins = [min(co[i] for co in remapped) for i in range(3)]
    new_maxs = [max(co[i] for co in remapped) for i in range(3)]
    new_extents = [new_maxs[i] - new_mins[i] for i in range(3)]
    target = (DIMENSIONS["length"], DIMENSIONS["width"], DIMENSIONS["height"])
    scales = [target[i] / new_extents[i] for i in range(3)]
    center_x = (new_mins[0] + new_maxs[0]) / 2
    center_y = (new_mins[1] + new_maxs[1]) / 2
    ground = new_mins[2]
    for vertex, co in zip(obj.data.vertices, remapped):
        # Hunyuan's canonical vehicle front is negative on the longest axis.
        # Flip it so the reconstruction convention is +X = vehicle front.
        vertex.co = (
            -(co.x - center_x) * scales[0],
            (co.y - center_y) * scales[1],
            (co.z - ground) * scales[2],
        )
    obj.data.update()
    return {
        "source_extents": extents,
        "axis_map_length_width_height": [length_axis, width_axis, height_axis],
        "scale_xyz": scales,
        "target_dimensions": list(target),
    }


def make_material() -> bpy.types.Material:
    material = bpy.data.materials.new("R8 Base Mesh Diagnostic Red")
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.62, 0.006, 0.012, 1)
    bsdf.inputs["Metallic"].default_value = 0.5
    bsdf.inputs["Roughness"].default_value = 0.22
    return material


def setup_studio() -> bpy.types.Object:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 480
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.045, 0.05, 0.06)

    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -0.012))
    floor = bpy.context.object
    floor.name = "QA_Floor"
    floor_mat = bpy.data.materials.new("QA Floor")
    floor_mat.diffuse_color = (0.1, 0.11, 0.13, 1)
    floor.data.materials.append(floor_mat)

    for location, energy, size in (
        ((4.5, -4.0, 6.0), 1500, 4.5),
        ((-4.0, 3.5, 4.0), 1000, 3.0),
        ((0.0, 5.0, 2.8), 800, 2.5),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.rotation_euler = (Vector((0, 0, 0.6)) - light.location).to_track_quat("-Z", "Y").to_euler()

    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.name = "QA_Camera"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 5.7
    scene.camera = camera
    return camera


def main() -> None:
    reset_scene()
    obj = joined_mesh()
    audit = normalize_axes_and_size(obj)
    obj.data.materials.clear()
    obj.data.materials.append(make_material())
    for polygon in obj.data.polygons:
        polygon.use_smooth = True

    camera = setup_studio()
    render_dir = WORK / "hunyuan-renders"
    render_dir.mkdir(parents=True, exist_ok=True)
    distance = 7.2
    for index, name in enumerate(VIEW_NAMES):
        angle = math.radians(index * 45)
        camera.location = (math.cos(angle) * distance, math.sin(angle) * distance, 2.2)
        camera.rotation_euler = (Vector((0, 0, 0.65)) - camera.location).to_track_quat("-Z", "Y").to_euler()
        bpy.context.scene.render.filepath = str(render_dir / f"{index:02d}-{name}.png")
        bpy.ops.render.render(write_still=True)

    (WORK / "r8-hunyuan-normalization.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(WORK / "r8-hunyuan-base-normalized.blend"))
    print(json.dumps(audit, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
