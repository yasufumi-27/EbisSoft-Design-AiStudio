"""Render the generated Blender source for visual QA."""

import bpy
import math
from pathlib import Path
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = Path("/tmp/audi-r8-spyder-preview.png")


def look_at(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


# Studio cyclorama substitute.
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0.0))
floor = bpy.context.object
floor.name = "QA Studio Floor"
floor_mat = bpy.data.materials.new("QA Floor")
floor_mat.diffuse_color = (0.018, 0.022, 0.03, 1)
floor.data.materials.append(floor_mat)

bpy.ops.object.camera_add(location=(6.4, -7.2, 3.5))
camera = bpy.context.object
look_at(camera, (0, 0, 0.72))
camera.data.lens = 58
bpy.context.scene.camera = camera

for name, location, energy, size, color in [
    ("Key", (3.2, -4.8, 6.2), 1500, 5.0, (1.0, 0.92, 0.86)),
    ("Fill", (-4.0, -1.2, 3.4), 1050, 4.0, (0.55, 0.72, 1.0)),
    ("Rim", (-2.5, 4.5, 4.8), 1800, 3.0, (1.0, 0.25, 0.18)),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = "DISK"
    light.data.size = size
    light.data.color = color
    look_at(light, (0, 0, 0.6))

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(OUTPUT)
scene.render.film_transparent = False
scene.world.color = (0.004, 0.005, 0.009)
scene.view_settings.look = "AgX - Medium High Contrast"
bpy.ops.render.render(write_still=True)
print(f"Rendered {OUTPUT}")
