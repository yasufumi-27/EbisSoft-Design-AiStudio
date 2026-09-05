"""Render the normalized licensed Type 42 source from diagnostic angles."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / "tools" / "blender" / "r8_type42" / "work"
SOURCE = WORK / "r8-type42-source-audit.blend"
OUTPUT = WORK / "source-renders"


def look_at(obj, target=(0, 0, 0.58)):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world.color = (0.012, 0.014, 0.02)
    scene.view_settings.look = "AgX - Medium High Contrast"

    floor_material = bpy.data.materials.new("Audit studio floor")
    floor_material.diffuse_color = (0.035, 0.042, 0.052, 1)
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -0.012))
    floor = bpy.context.object
    floor.name = "AUDIT_FLOOR"
    floor.data.materials.append(floor_material)

    for location, energy, size in (
        ((4.0, -3.5, 6.0), 1500, 4.0),
        ((-4.5, 2.0, 4.0), 1100, 3.5),
        ((0.0, 4.5, 2.8), 900, 3.0),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        look_at(light)

    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.name = "AUDIT_CAMERA"
    camera.data.lens = 62
    scene.camera = camera

    views = {
        "front-three-quarter": (4.9, -6.4, 2.35),
        "rear-three-quarter": (-4.9, 6.4, 2.35),
        "side": (6.8, 0.0, 1.75),
        "front": (0.0, -7.2, 1.7),
        "rear": (0.0, 7.2, 1.7),
    }
    for name, location in views.items():
        camera.location = location
        look_at(camera)
        scene.render.filepath = str(OUTPUT / f"{name}.png")
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
