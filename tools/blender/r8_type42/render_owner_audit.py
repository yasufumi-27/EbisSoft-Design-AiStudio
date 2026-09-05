"""Render orthogonal audit views of the rebuilt owner-spec R8."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / "tools" / "blender" / "r8_type42" / "work"
BLEND = WORK / "audi-r8-type42-owner-spyder-master.blend"
OUT = WORK / "owner-audit-renders"


def point_camera(camera, location, target=(0, 0, 0.58), lens=70):
    camera.location = location
    camera.data.lens = lens
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    OUT.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 760
    scene.render.resolution_percentage = 100
    camera = bpy.data.objects.get("AUDIT_CAMERA")
    views = {
        "01-front": ((0, -7.2, 1.05), (0, 0, 0.52), 76),
        "02-front-three-quarter": ((5.8, -7.6, 2.5), (0, 0, 0.58), 72),
        "03-side": ((7.6, 0, 1.25), (0, 0, 0.58), 76),
        "04-rear-three-quarter": ((5.8, 7.6, 2.35), (0, 0, 0.62), 72),
        "05-rear": ((0, 7.2, 1.05), (0, 0, 0.52), 76),
        "06-top": ((0, 0, 8.5), (0, 0, 0.3), 74),
    }
    for name, (location, target, lens) in views.items():
        point_camera(camera, location, target, lens)
        scene.render.filepath = str(OUT / f"{name}.png")
        bpy.ops.render.render(write_still=True)
        print(f"RENDERED={scene.render.filepath}")


if __name__ == "__main__":
    main()
