"""Convert the licensed high-poly Audi R8 base mesh into a red Spyder web asset.

Source asset (download separately):
  Audi R8 by wallon, CC BY 4.0
  https://sketchfab.com/3d-models/audi-r8-e17e438f076f4427a58d93aa779edaed

The source path is supplied with R8_BASE_MODEL. The generated GLB is a modified
derivative: normalized, recoloured, roof/side glazing removed, and a custom
open-cabin rear deck, roll hoops, seats, and Spyder trim added in Blender.
"""

import bpy
import bmesh
import math
import os
from mathutils import Matrix, Vector
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE = os.environ.get("R8_BASE_MODEL")
OUTPUT = ROOT / "public" / "models" / "audi-r8-spyder.glb"
BLEND_SOURCE = ROOT / "tools" / "blender" / "audi-r8-spyder.blend"

if not SOURCE:
    raise RuntimeError("Set R8_BASE_MODEL to the licensed source scene.gltf")


def set_principled(mat, color, metallic, roughness):
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    # Remove the original orange body texture while retaining non-body PBR textures.
    base = bsdf.inputs["Base Color"]
    for link in list(base.links):
        mat.node_tree.links.remove(link)


def make_material(name, color, metallic=0.0, roughness=0.4):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    set_principled(mat, color, metallic, roughness)
    return mat


def bevelled_cube(name, location, scale, mat, bevel=0.025, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    modifier = obj.modifiers.new("Spyder edge softness", "BEVEL")
    modifier.width = bevel
    modifier.segments = 3
    return obj


def torus(name, location, major, minor, mat, rotation=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=48,
        minor_segments=12,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def ellipsoid(name, location, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=SOURCE)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
corners = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
minimum = Vector(tuple(min(v[i] for v in corners) for i in range(3)))
maximum = Vector(tuple(max(v[i] for v in corners) for i in range(3)))
center = (minimum + maximum) * 0.5
dimensions = maximum - minimum

# Normalize to the real 4.43 m overall length and a conventional X-forward layout.
root = bpy.data.objects.new("Audi_R8_Spyder_CC_BY", None)
bpy.context.collection.objects.link(root)
for obj in [candidate for candidate in bpy.context.scene.objects if candidate != root and candidate.parent is None]:
    obj.parent = root
scale = 4.43 / dimensions.y
root.scale = (scale,) * 3
root.rotation_euler.z = math.pi / 2
rotated_center = Matrix.Rotation(math.pi / 2, 4, "Z") @ center
root.location = -rotated_center * scale
bpy.context.view_layer.update()

world_corners = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
root.location.z -= min(v.z for v in world_corners)
bpy.context.view_layer.update()

# Coupe-to-Spyder conversion: keep the windscreen, remove roof, rear glass and raised side glass.
remove_names = {"roof_pure black_0", "Plane_glass_0", "Doors.014_glass_0"}
for name in remove_names:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

# Several roof panels are fused into larger body meshes. Remove only vertices in
# the coupe roof volume while keeping the separate windscreen and its lower frame.
for obj in [candidate for candidate in bpy.context.scene.objects if candidate.type == "MESH"]:
    if obj.name == "Plane.007_glass_0":
        continue
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    roof_vertices = []
    for vertex in bm.verts:
        world = obj.matrix_world @ vertex.co
        if -0.78 < world.x < 0.84 and world.z > 0.96:
            roof_vertices.append(vertex)
    if roof_vertices:
        bmesh.ops.delete(bm, geom=roof_vertices, context="VERTS")
        bm.to_mesh(obj.data)
        obj.data.update()
    bm.free()

# Reference-photo red paint. All imported body panels share the material named `body`.
body = bpy.data.materials.get("body")
if body:
    body.name = "BodyPaint"
    set_principled(body, (0.62, 0.004, 0.008), 0.82, 0.14)

# Use a neutral, unbranded plate rather than the source asset's creator plate texture.
plate = bpy.data.materials.get("license_plate")
if plate:
    set_principled(plate, (0.12, 0.13, 0.15), 0.25, 0.34)

spyder_red = body or make_material("BodyPaint", (0.62, 0.004, 0.008), 0.82, 0.14)
spyder_black = make_material("SpyderCarbon", (0.008, 0.011, 0.016), 0.72, 0.2)
spyder_leather = make_material("IvoryLeather", (0.68, 0.59, 0.42), 0.03, 0.52)
spyder_metal = make_material("BrushedAluminium", (0.42, 0.45, 0.49), 0.95, 0.17)

# New rear tonneau/deck and buttresses fill the former coupe roof transition.
deck_parts = [
    bevelled_cube("BodyPaint_SpyderDeck", (-1.05, 0, 0.82), (0.48, 0.73, 0.045), spyder_red, 0.055, (0, 0.025, 0)),
    ellipsoid("BodyPaint_LeftButtress", (-0.79, -0.49, 0.87), (0.3, 0.18, 0.1), spyder_red),
    ellipsoid("BodyPaint_RightButtress", (-0.79, 0.49, 0.87), (0.3, 0.18, 0.1), spyder_red),
    bevelled_cube("SpyderDeckInsert", (-0.91, 0, 0.86), (0.28, 0.27, 0.025), spyder_black, 0.02),
]

# Two visible seats and polished rollover hoops matching the open-top reference.
for side in (-1, 1):
    seat_y = side * 0.36
    parts = [
        bevelled_cube(f"IvorySeatBase_{side}", (-0.08, seat_y, 0.61), (0.3, 0.24, 0.065), spyder_leather, 0.05),
        bevelled_cube(f"IvorySeatBack_{side}", (-0.31, seat_y, 0.81), (0.1, 0.23, 0.25), spyder_leather, 0.07, (0, -0.15, 0)),
        ellipsoid(f"IvoryHeadrest_{side}", (-0.39, seat_y, 1.0), (0.12, 0.18, 0.11), spyder_leather),
        torus(f"RolloverHoop_{side}", (-0.61, seat_y, 1.01), 0.145, 0.027, spyder_metal),
    ]

# Dark opening around the cabin makes the removed roof read as an intentional Spyder conversion.
cockpit = bevelled_cube("SpyderCockpitOpening", (-0.06, 0, 0.7), (0.7, 0.67, 0.045), spyder_black, 0.05)

# Reinstate the slim black windshield surround after cutting the coupe roof.
windshield_frame = [
    bevelled_cube("SpyderWindshieldHeader", (0.55, 0, 1.15), (0.035, 0.71, 0.025), spyder_black, 0.012),
    bevelled_cube("SpyderAPillarLeft", (0.61, -0.69, 0.98), (0.025, 0.025, 0.2), spyder_black, 0.01, (0, -0.27, 0)),
    bevelled_cube("SpyderAPillarRight", (0.61, 0.69, 0.98), (0.025, 0.025, 0.2), spyder_black, 0.01, (0, -0.27, 0)),
]

# Add provenance to the exported scene.
root["title"] = "Audi R8 Spyder — modified web reference model"
root["attribution"] = "Audi R8 by wallon, Sketchfab, CC BY 4.0"
root["source"] = "https://sketchfab.com/3d-models/audi-r8-e17e438f076f4427a58d93aa779edaed"
root["changes"] = "Recoloured red; roof and side glazing removed; custom Spyder deck, cabin, seats and roll hoops added in Blender."

# Apply modifiers only on the newly created parts.
for obj in deck_parts + [cockpit] + windshield_frame + [candidate for candidate in bpy.context.scene.objects if candidate.name.startswith(("Ivory", "Rollover"))]:
    if obj.type != "MESH":
        continue
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_SOURCE))
bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format="GLB",
    export_apply=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_yup=True,
)
print(f"Exported {OUTPUT} ({OUTPUT.stat().st_size / 1024 / 1024:.2f} MiB)")
