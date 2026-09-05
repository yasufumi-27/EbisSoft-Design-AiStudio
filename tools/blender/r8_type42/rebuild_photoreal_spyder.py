"""Convert the licensed Type 42 facelift coupe into the owner's R8 Spyder.

The human-authored source supplies the production body surfacing, panel gaps,
lighting, cabin and engine. Owner-specific Spyder, wheel and fascia parts are
kept separate and editable for later hand surfacing.
"""

from __future__ import annotations

import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / "tools" / "blender" / "r8_type42" / "work"
SOURCE = WORK / "r8-type42-source-audit.blend"
OUTPUT_BLEND = WORK / "audi-r8-type42-owner-spyder-master.blend"
OUTPUT_GLB = WORK / "audi-r8-type42-owner-spyder-web.glb"
OUTPUT_RENDER = WORK / "audi-r8-type42-owner-spyder-hero.png"

RED = (0.72, 0.006, 0.012, 1)
BLACK = (0.006, 0.008, 0.012, 1)
TAN = (0.62, 0.43, 0.24, 1)


def principled_material(name, color, *, metallic=0.0, roughness=0.35, transmission=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    for link in list(mat.node_tree.links):
        if link.to_node == bsdf and link.to_socket == bsdf.inputs["Base Color"]:
            mat.node_tree.links.remove(link)
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    mat.diffuse_color = color
    return mat


def set_existing_material(mat, color, *, metallic, roughness):
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return
    for link in list(mat.node_tree.links):
        if link.to_node == bsdf and link.to_socket == bsdf.inputs["Base Color"]:
            mat.node_tree.links.remove(link)
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    mat.diffuse_color = color


def recolor_source():
    for mat in bpy.data.materials:
        lower = mat.name.lower()
        if "paint" in lower:
            set_existing_material(mat, RED, metallic=0.58, roughness=0.19)
        elif "coloured" in lower:
            set_existing_material(mat, (0.055, 0.06, 0.07, 1), metallic=0.12, roughness=0.3)
        elif "carbon" in lower:
            set_existing_material(mat, (0.008, 0.01, 0.014, 1), metallic=0.18, roughness=0.24)


def remove_source_parts():
    remove_tokens = (
        "wheel1a",
        "calliper",
        "manufacturerplate",
        "grille1_geo",
        "grille2_geo",
        "grille3_geo",
    )
    for obj in list(bpy.context.scene.objects):
        if any(token in obj.name.lower() for token in remove_tokens):
            bpy.data.objects.remove(obj, do_unlink=True)


def remove_vertices_in_world_region(obj, predicate):
    if obj.type != "MESH" or not obj.data.vertices:
        return
    matrix = obj.matrix_world
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    doomed = [vert for vert in bm.verts if predicate(matrix @ vert.co)]
    if doomed:
        bmesh.ops.delete(bm, geom=doomed, context="VERTS")
        bm.to_mesh(obj.data)
        obj.data.update()
    bm.free()


def open_coupe_roof():
    for obj in bpy.context.scene.objects:
        lower = obj.name.lower()
        roof_mesh = any(token in lower for token in ("paint_geo", "window_geo", "windowinside", "carbon1_geo", "base_geo", "coloured_geo"))
        if obj.type != "MESH" or not roof_mesh:
            continue
        # The source combines its greenhouse across multiple materials. Remove
        # the coupe roof behind the windscreen in world space; the Spyder deck
        # and cockpit rim below close this cut with purpose-built surfaces.
        threshold = 0.75 if "window" in lower else 0.885
        remove_vertices_in_world_region(
            obj,
            lambda p, z0=threshold: -0.20 < p.y < 1.62 and p.z > z0 and abs(p.x) < 1.08,
        )
    # Interior is a single detailed mesh. Only remove its headliner, retaining
    # the production seat surfaces that are extracted and recoloured below.
    for obj in bpy.context.scene.objects:
        if "interior_geo" in obj.name.lower():
            remove_vertices_in_world_region(
                obj,
                lambda p: -0.20 < p.y < 1.45 and abs(p.x) < 0.94 and (
                    p.z > 1.10 or (p.z > 0.96 and (p.y > 0.55 or abs(p.x) < 0.15 or abs(p.x) > 0.62))
                ),
            )
        if "engine_geo" in obj.name.lower():
            # Coupe engine-cover glazing/struts sit above the Spyder deck.
            # Mechanical detail below the deck remains intact.
            remove_vertices_in_world_region(
                obj,
                lambda p: 0.25 < p.y < 1.55 and p.z > 0.89 and abs(p.x) < 0.92,
            )
        if "light_geo" in obj.name.lower():
            # Coupe high-mounted stop lamp belongs to the removed rear glass.
            remove_vertices_in_world_region(
                obj,
                lambda p: 0.20 < p.y < 1.20 and p.z > 1.0 and abs(p.x) < 0.42,
            )


def smooth(obj):
    if obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True
    return obj


def bevel(obj, width=0.01, segments=3):
    modifier = obj.modifiers.new("Production edge radius", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    return obj


def cube(name, location, dimensions, material, *, radius=0.02, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if radius:
        bevel(obj, radius, 4)
    obj["export_model"] = True
    return obj


def curve_tube(name, points, radius, material, *, cyclic=False, resolution=3):
    data = bpy.data.curves.new(f"{name}_Curve", "CURVE")
    data.dimensions = "3D"
    data.resolution_u = resolution
    data.bevel_depth = radius
    data.bevel_resolution = 3
    spline = data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, coordinate in zip(spline.points, points):
        point.co = (*coordinate, 1)
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    obj["export_model"] = True
    return obj


def deck_surface(red):
    y_stations = (0.38, 0.56, 0.80, 1.08, 1.42, 1.67)
    x_steps = 18
    verts = []
    for y in y_stations:
        width = 0.82 + 0.10 * min(1.0, max(0.0, (y - 0.38) / 0.7))
        center_z = 0.79 + 0.08 * math.sin((y - 0.38) / 1.29 * math.pi)
        for index in range(x_steps + 1):
            x = -width + 2 * width * index / x_steps
            crown = 0.055 * (1 - (x / width) ** 2)
            verts.append((x, y, center_z + crown))
    faces = []
    row = x_steps + 1
    for j in range(len(y_stations) - 1):
        for i in range(x_steps):
            a = j * row + i
            faces.append((a, a + 1, a + row + 1, a + row))
    mesh = bpy.data.meshes.new("Spyder_Rear_Deck_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Spyder_Rear_Deck", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(red)
    smooth(obj)
    solid = obj.modifiers.new("Deck skin thickness", "SOLIDIFY")
    solid.thickness = 0.018
    bevel(obj, 0.012, 3)
    obj["export_model"] = True


def extract_owner_seats(tan):
    """Reuse the source's sculpted seat leather instead of primitive blocks."""
    source = next((obj for obj in bpy.context.scene.objects if obj.type == "MESH" and "interior_geo" in obj.name.lower()), None)
    if source is None:
        return
    for side, suffix in ((-1, "R"), (1, "L")):
        seat = source.copy()
        seat.data = source.data.copy()
        seat.name = f"Owner_Beige_Production_Seat_{suffix}"
        bpy.context.collection.objects.link(seat)
        remove_vertices_in_world_region(
            seat,
            lambda p, s=side: not (
                0.12 < s * p.x < 0.62 and -0.20 < p.y < 0.68 and 0.38 < p.z < 1.09
            ),
        )
        seat.data.materials.clear()
        seat.data.materials.append(tan)
        for polygon in seat.data.polygons:
            polygon.material_index = 0
        solid = seat.modifiers.new("Leather overlay separation", "SOLIDIFY")
        solid.thickness = 0.006
        solid.offset = 1.0
        seat["export_model"] = True


def add_spyder_parts(red, black, aluminium, tan):
    deck_surface(red)
    extract_owner_seats(tan)
    cube("Spyder_Cockpit_Rear_Trim", (0, 0.40, 0.83), (1.48, 0.10, 0.10), black, radius=0.035)

    for side, suffix in ((-1, "R"), (1, "L")):
        x = side * 0.37
        bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=(x, 0.91, 0.80))
        fairing = bpy.context.object
        fairing.name = f"Spyder_Headrest_Fairing_{suffix}"
        fairing.scale = (0.23, 0.28, 0.085)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        fairing.data.materials.append(red)
        smooth(fairing)
        fairing["export_model"] = True
        for slat in range(5):
            cube(
                f"Spyder_Deck_Vent_{suffix}_{slat + 1}",
                (x, 0.80 + slat * 0.047, 0.895 - slat * 0.010),
                (0.24, 0.025, 0.018),
                black,
                radius=0.006,
            )

    # Retain the source windscreen frame: it already follows the production
    # A-pillar curvature and is more accurate than a procedural tube surround.

    # Type 42 fuel door: a separate serviceable part on the right rear quarter.
    fuel_door = cylinder("R8_Fuel_Door", 0.066, 0.006, (0.959, 1.20, 0.77), aluminium, vertices=96)
    bevel(fuel_door, 0.004, 2)


def cylinder(name, radius, depth, location, material, *, vertices=96):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=(0, math.pi / 2, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    smooth(obj)
    obj["export_model"] = True
    return obj


def add_owner_wheel(code, x, y, radius, width, silver, dark_alloy, rubber, steel, caliper_mat, red_badge):
    side = 1 if x > 0 else -1
    outer_x = x + side * width * 0.50
    # Child parts are authored in world coordinates. A root at the wheel
    # position would apply that translation twice after parenting.
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    parent = bpy.context.object
    parent.name = f"WheelAssembly_{code}"
    parent["export_model"] = True

    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius - 0.052,
        minor_radius=0.052,
        major_segments=128,
        minor_segments=32,
        location=(x, y, radius),
        rotation=(0, math.pi / 2, 0),
    )
    tire = bpy.context.object
    tire.name = f"Michelin_Tire_{code}"
    # Keep the torus circular after rotating it onto the vehicle's X axle. The
    # separate barrel communicates wheel width without distorting tire radius.
    tire.data.materials.append(rubber)
    smooth(tire)
    tire["export_model"] = True
    tire.parent = parent

    barrel = cylinder(f"Wheel_Barrel_{code}", radius - 0.078, width * 0.76, (x, y, radius), dark_alloy)
    disc = cylinder(f"Drilled_Brake_Disc_{code}", radius - 0.125, 0.026, (outer_x - side * 0.045, y, radius), steel)
    hub = cylinder(f"Audi_Wheel_Hub_{code}", 0.052, 0.038, (outer_x + side * 0.006, y, radius), silver, vertices=64)
    for obj in (barrel, disc, hub):
        obj.parent = parent

    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius - 0.092,
        minor_radius=0.014,
        major_segments=128,
        minor_segments=16,
        location=(outer_x, y, radius),
        rotation=(0, math.pi / 2, 0),
    )
    lip = bpy.context.object
    lip.name = f"Diamond_Cut_Rim_Lip_{code}"
    lip.data.materials.append(silver)
    smooth(lip)
    lip["export_model"] = True
    lip.parent = parent

    # Five shared stems branching into ten swept Y spokes, matching the supplied wheel image.
    for group in range(5):
        base = math.radians(90) + group * math.tau / 5
        for branch, delta in (("A", -0.32), ("B", 0.32)):
            points = []
            for radial, angle in ((0.050, base), (0.155, base), (radius - 0.105, base + delta)):
                points.append((outer_x + side * 0.012, y + math.cos(angle) * radial, radius + math.sin(angle) * radial))
            spoke = curve_tube(f"SplitY_Spoke_{code}_{group + 1}{branch}", points, 0.025, dark_alloy)
            spoke.parent = parent
            highlight_points = []
            for radial, angle in ((0.145, base), (radius - 0.108, base + delta)):
                highlight_points.append((outer_x + side * 0.016, y + math.cos(angle) * radial, radius + math.sin(angle) * radial))
            highlight = curve_tube(f"DiamondCut_Face_{code}_{group + 1}{branch}", highlight_points, 0.010, silver)
            highlight.parent = parent

    caliper_y = y + 0.13
    caliper = cube(f"R8_Brake_Caliper_{code}", (outer_x - side * 0.055, caliper_y, radius), (0.055, 0.10, 0.20), caliper_mat, radius=0.025)
    caliper.parent = parent
    badge = cube(f"R8_Caliper_Badge_{code}", (outer_x + side * 0.001, caliper_y - 0.002, radius), (0.008, 0.052, 0.07), red_badge, radius=0.006)
    badge.parent = parent


def add_owner_wheels(silver, dark_alloy, rubber, steel, caliper_mat, red_badge):
    for side, suffix in ((-1, "R"), (1, "L")):
        add_owner_wheel(f"F{suffix}", side * 0.827, -1.325, 0.334, 0.235, silver, dark_alloy, rubber, steel, caliper_mat, red_badge)
        add_owner_wheel(f"R{suffix}", side * 0.805, 1.325, 0.337, 0.295, silver, dark_alloy, rubber, steel, caliper_mat, red_badge)


def hex_loop(name, center, radius, material):
    x, y, z = center
    points = [
        (x + math.cos(math.radians(30 + i * 60)) * radius, y, z + math.sin(math.radians(30 + i * 60)) * radius)
        for i in range(6)
    ]
    return curve_tube(name, points, 0.006, material, cyclic=True, resolution=1)


def honeycomb_panel(prefix, center_x, center_z, columns, rows, radius, y, material):
    x_spacing = radius * 1.55
    z_spacing = radius * 1.72
    for row in range(rows):
        for column in range(columns):
            x = center_x + (column - (columns - 1) / 2) * x_spacing
            z = center_z + (row - (rows - 1) / 2) * z_spacing
            if row % 2:
                x += x_spacing * 0.5
            depth = y(z) if callable(y) else y
            hex_loop(f"{prefix}_{row:02d}_{column:02d}", (x, depth, z), radius, material)


def darken_existing_front_opening(black):
    """Use the source fascia itself as the conforming black grille backing."""
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not any(token in obj.name.lower() for token in ("base_geo", "coloured_geo")):
            continue
        obj.data.materials.append(black)
        black_index = len(obj.data.materials) - 1
        matrix = obj.matrix_world
        for polygon in obj.data.polygons:
            center = matrix @ polygon.center
            if abs(center.x) < 0.53 and center.y < -1.88 and 0.18 < center.z < 0.64:
                polygon.material_index = black_index


def apply_owner_rear_finish(black, tail_red):
    """Apply the owner's flush black rear panel and red lamp lenses."""
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        lower = obj.name.lower()
        if "base_geo" in lower:
            # The production base mesh already describes the rear recess,
            # diffuser and grille contours. Making that trim gloss black keeps
            # the owner's panel flush instead of adding a floating rectangle.
            for material in obj.data.materials:
                set_existing_material(material, BLACK, metallic=0.22, roughness=0.16)
        if "coloured_geo" in lower:
            obj.data.materials.append(black)
            index = len(obj.data.materials) - 1
            matrix = obj.matrix_world
            for polygon in obj.data.polygons:
                center = matrix @ polygon.center
                if abs(center.x) < 0.61 and center.y > 1.91 and 0.35 < center.z < 0.72:
                    polygon.material_index = index
    source_light = next((obj for obj in bpy.context.scene.objects if obj.type == "MESH" and "light_geo" in obj.name.lower()), None)
    if source_light is not None:
        rear_lights = source_light.copy()
        rear_lights.data = source_light.data.copy()
        rear_lights.name = "Owner_Red_Rear_Light_Lenses"
        bpy.context.collection.objects.link(rear_lights)
        remove_vertices_in_world_region(
            rear_lights,
            lambda p: not (p.y > 1.68 and 0.42 < p.z < 0.86),
        )
        rear_lights.data.materials.clear()
        rear_lights.data.materials.append(tail_red)
        for polygon in rear_lights.data.polygons:
            polygon.material_index = 0
        lens_shell = rear_lights.modifiers.new("Lens overlay separation", "SOLIDIFY")
        lens_shell.thickness = 0.003
        lens_shell.offset = 1.0
        rear_lights["export_model"] = True


def add_owner_fascias(black, honeycomb, chrome, tail_red):
    # Front is -Y in the licensed asset.
    darken_existing_front_opening(black)
    apply_owner_rear_finish(black, tail_red)
    # Small, recessed cells follow the source bumper's actual depth profile.
    grille_depth = lambda z: (-2.20 + max(0.0, z - 0.24) * 0.50) - 0.006
    honeycomb_panel("Front_Honeycomb", 0, 0.43, 9, 4, 0.041, grille_depth, honeycomb)

    # Owner photo: a gloss-black inset directly below the rear rings. Match the
    # source bumper's rearward slope so the panel reads as flush, not attached.
    cube("Owner_Rear_Black_Center_Panel", (0, 2.226, 0.51), (0.90, 0.018, 0.27), black, radius=0.032)

    # Preserve the source badge geometry: its ring proportions and bevels are
    # considerably more faithful than procedural torus approximations.


def mark_source_for_export():
    for obj in bpy.context.scene.objects:
        if obj.type in {"MESH", "CURVE", "EMPTY"} and not obj.name.startswith("AUDIT_"):
            obj["export_model"] = True


def setup_studio():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 820
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world.color = (0.008, 0.01, 0.016)
    scene.view_settings.look = "AgX - Medium High Contrast"
    floor_mat = principled_material("Studio_Floor_Material", (0.028, 0.032, 0.04, 1), roughness=0.24)
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -0.012))
    floor = bpy.context.object
    floor.name = "AUDIT_FLOOR"
    floor.data.materials.append(floor_mat)
    for location, energy, size in (
        ((4.5, -4.5, 6.0), 1750, 4.5),
        ((-4.0, 3.5, 4.2), 1200, 3.5),
        ((0.0, 5.0, 2.6), 850, 3.0),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.rotation_euler = (Vector((0, 0, 0.58)) - light.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=(5.8, -7.6, 2.5))
    camera = bpy.context.object
    camera.name = "AUDIT_CAMERA"
    camera.data.lens = 72
    camera.rotation_euler = (Vector((0, 0, 0.58)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = camera


def export_model():
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.get("export_model") and obj.type in {"MESH", "CURVE", "EMPTY"}:
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=True,
    )


def main():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    recolor_source()
    remove_source_parts()
    open_coupe_roof()

    red = principled_material("Owner Misano Red Pearl", RED, metallic=0.58, roughness=0.18)
    black = principled_material("Owner Gloss Black", BLACK, metallic=0.22, roughness=0.16)
    honeycomb = principled_material("Open Honeycomb Mesh", (0.018, 0.021, 0.026, 1), metallic=0.35, roughness=0.27)
    aluminium = principled_material("Brushed Aluminium", (0.58, 0.62, 0.68, 1), metallic=0.96, roughness=0.18)
    silver = principled_material("Diamond Cut Wheel Face", (0.52, 0.55, 0.59, 1), metallic=0.98, roughness=0.16)
    dark_alloy = principled_material("Wheel Gunmetal Recess", (0.075, 0.085, 0.10, 1), metallic=0.90, roughness=0.23)
    rubber = principled_material("Michelin Pilot Sport Rubber", (0.006, 0.007, 0.009, 1), roughness=0.68)
    steel = principled_material("Drilled Brake Steel", (0.22, 0.23, 0.25, 1), metallic=0.93, roughness=0.30)
    caliper = principled_material("R8 Black Brake Caliper", (0.012, 0.014, 0.018, 1), metallic=0.46, roughness=0.19)
    red_badge = principled_material("R8 Caliper Badge", (0.72, 0.004, 0.008, 1), metallic=0.15, roughness=0.22)
    tan = principled_material("Owner Beige Leather", TAN, roughness=0.42)
    chrome = principled_material("Audi Chrome", (0.72, 0.75, 0.78, 1), metallic=1.0, roughness=0.10)

    add_spyder_parts(red, black, aluminium, tan)
    add_owner_wheels(silver, dark_alloy, rubber, steel, caliper, red_badge)
    tail_red = principled_material("Owner Red Tail Lamp Lens", (0.62, 0.004, 0.008, 1), metallic=0.12, roughness=0.19)
    add_owner_fascias(black, honeycomb, chrome, tail_red)
    mark_source_for_export()
    setup_studio()

    scene = bpy.context.scene
    scene["source_attribution"] = "Audi R8 V10 (Type 42) by Mona x Supercars / Car2022, CC BY 4.0"
    scene["source_url"] = "https://sketchfab.com/3d-models/audi-r8-v10-type-42-7463fcd44a00428486c09487f7fcda0c"
    scene["owner_configuration"] = "Type 42 facelift Spyder; red; aftermarket honeycomb front grille; black rear center panel; owner-reference split-Y wheels"
    scene["separate_components"] = "body, interior, engine, source lights, Spyder deck, seats, wheels, tires, brakes, front grille, rear panel"
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    export_model()
    scene.render.filepath = str(OUTPUT_RENDER)
    bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"OUTPUT_GLB={OUTPUT_GLB}")
    print(f"OUTPUT_RENDER={OUTPUT_RENDER}")


if __name__ == "__main__":
    main()
