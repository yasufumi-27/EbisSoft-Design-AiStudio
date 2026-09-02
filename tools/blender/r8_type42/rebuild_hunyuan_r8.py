"""Turn the learned Hunyuan cage into an editable, componentized R8 demo asset."""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / "tools" / "blender" / "r8_type42" / "work"
SOURCE_BLEND = WORK / "r8-hunyuan-base-normalized.blend"
OUTPUT_BLEND = WORK / "r8-type42-hunyuan-rebuild.blend"
OUTPUT_GLB = WORK / "r8-type42-hunyuan-rebuild.glb"
AXLE_X = 2.649 / 2
WHEEL_Z = 0.335
TRACK_Y = 0.855
VIEW_NAMES = ("front", "front-right", "right", "rear-right", "back", "rear-left", "left", "front-left")
VIEW_DIRECTIONS = tuple(
    Vector((math.cos(math.radians(index * 45)), -math.sin(math.radians(index * 45)), 0))
    for index in range(8)
)


def material(name, color, *, metallic=0.0, roughness=0.4, transmission=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = 3.0
    return mat


def mark_model(obj, group):
    obj["export_model"] = True
    obj["part_group"] = group
    return obj


def parent_keep_world(obj, parent):
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world


def load_body():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE_BLEND))
    body = bpy.data.objects.get("R8_Hunyuan_RawBody")
    if body is None:
        raise RuntimeError("Normalized Hunyuan body is missing")
    for obj in list(bpy.context.scene.objects):
        if obj != body:
            bpy.data.objects.remove(obj, do_unlink=True)

    # The normalization pass already maps the Hunyuan front to +X.
    body.name = "Body_R8_Type42_Spyder"
    mark_model(body, "body")
    return body


def add_multiview_vertex_colors(body):
    views = []
    for name in VIEW_NAMES:
        image = bpy.data.images.load(str(WORK / "views" / "rgba" / f"{name}.png"), check_existing=False)
        width, height = image.size
        pixels = list(image.pixels[:])
        alpha_points = []
        for py in range(height):
            row = py * width * 4
            for px in range(width):
                if pixels[row + px * 4 + 3] > 0.15:
                    alpha_points.append((px, py))
        bounds = (
            min(point[0] for point in alpha_points),
            min(point[1] for point in alpha_points),
            max(point[0] for point in alpha_points),
            max(point[1] for point in alpha_points),
        )
        views.append((width, height, pixels, bounds))

    colors = body.data.color_attributes.get("R8_ViewColor")
    if colors is None:
        colors = body.data.color_attributes.new(name="R8_ViewColor", type="BYTE_COLOR", domain="CORNER")

    for poly in body.data.polygons:
        normal_xy = Vector((poly.normal.x, poly.normal.y, 0))
        if normal_xy.length < 0.12:
            center = sum((body.data.vertices[index].co for index in poly.vertices), Vector((0, 0, 0))) / len(poly.vertices)
            normal_xy = Vector((center.x, center.y, 0))
        if normal_xy.length:
            normal_xy.normalize()
        view_index = max(range(8), key=lambda index: normal_xy.dot(VIEW_DIRECTIONS[index]))
        direction = VIEW_DIRECTIONS[view_index]
        right = Vector((-direction.y, direction.x, 0))
        half_extent = abs(right.x) * 4.44 / 2 + abs(right.y) * 1.905 / 2
        width, height, pixels, (min_x, min_y, max_x, max_y) = views[view_index]
        for loop_index in poly.loop_indices:
            vertex = body.data.vertices[body.data.loops[loop_index].vertex_index].co
            horizontal = vertex.x * right.x + vertex.y * right.y
            px = round((min_x + max_x) / 2 + horizontal / (2 * half_extent) * (max_x - min_x))
            py = round(min_y + max(0.0, min(1.0, vertex.z / 1.245)) * (max_y - min_y))
            px = max(0, min(width - 1, px))
            py = max(0, min(height - 1, py))
            offset = (py * width + px) * 4
            rgba = tuple(pixels[offset + channel] for channel in range(4))
            if rgba[3] < 0.1:
                rgba = (0.58, 0.006, 0.012, 1.0)
            colors.data[loop_index].color_srgb = rgba


def multiview_material():
    mat = bpy.data.materials.new("R8 8-view projected appearance")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    vertex_color = nodes.new("ShaderNodeVertexColor")
    vertex_color.layer_name = "R8_ViewColor"
    links.new(vertex_color.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 0.38
    bsdf.inputs["Roughness"].default_value = 0.24
    return mat


def assign_body_materials(body, projected):
    body.data.materials.clear()
    body.data.materials.append(projected)
    for poly in body.data.polygons:
        poly.material_index = 0
        poly.use_smooth = True


def cylinder(name, radius, depth, location, mat, *, vertices=64, group="wheel"):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=(math.pi / 2, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return mark_model(obj, group)


def spoke_prism(name, x, y, z, angle_inner, angle_outer, side, rim_mat):
    r0, r1 = 0.065, 0.238
    w0, w1 = 0.021, 0.013
    # A swept, tapered spoke in the X/Z wheel plane, extruded across Y.
    points = []
    for radius, angle, width in (
        (r0, angle_inner, w0),
        (r1, angle_outer, w1),
    ):
        tangent = Vector((-math.sin(angle), 0, math.cos(angle)))
        radial = Vector((math.cos(angle), 0, math.sin(angle)))
        center = Vector((x, y, z)) + radial * radius
        points.append(center + tangent * width)
        points.append(center - tangent * width)
    outline = (points[0], points[2], points[3], points[1])
    half_depth = 0.022
    verts = []
    for dy in (-half_depth, half_depth):
        verts.extend((point.x, point.y + dy * side, point.z) for point in outline)
    faces = [(0, 1, 2, 3), (7, 6, 5, 4)]
    faces.extend((i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(rim_mat)
    bevel = obj.modifiers.new("Machined spoke edge", "BEVEL")
    bevel.width = 0.008
    bevel.segments = 3
    return mark_model(obj, "wheel")


def add_wheel(code, x, y, tire_mat, rim_mat, disc_mat, caliper_mat):
    side = 1 if y > 0 else -1
    outer_face_y = y + side * 0.095
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(x, y, WHEEL_Z))
    assembly = bpy.context.object
    assembly.name = f"Wheel_{code}"
    mark_model(assembly, "wheel")

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.285,
        minor_radius=0.052,
        major_segments=96,
        minor_segments=28,
        location=(x, y, WHEEL_Z),
        rotation=(math.pi / 2, 0, 0),
    )
    tire = bpy.context.object
    tire.name = f"Tire_{code}"
    # After the 90-degree X rotation, local Z is the wheel axle (world Y).
    tire.scale.z = 1.35
    tire.data.materials.append(tire_mat)
    mark_model(tire, "tire")

    barrel = cylinder(f"WheelBarrel_{code}", 0.249, 0.17, (x, y, WHEEL_Z), rim_mat, vertices=96)
    disc = cylinder(f"BrakeDisc_{code}", 0.195, 0.176, (x, y, WHEEL_Z), disc_mat, vertices=96)
    hub = cylinder(f"WheelHub_{code}", 0.058, 0.19, (x, y, WHEEL_Z), rim_mat, vertices=64)
    for obj in (barrel, disc, hub):
        parent_keep_world(obj, assembly)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.225,
        minor_radius=0.019,
        major_segments=96,
        minor_segments=16,
        location=(x, outer_face_y, WHEEL_Z),
        rotation=(math.pi / 2, 0, 0),
    )
    lip = bpy.context.object
    lip.name = f"WheelLip_{code}"
    lip.data.materials.append(rim_mat)
    mark_model(lip, "wheel")
    parent_keep_world(lip, assembly)

    for group_index in range(5):
        base = math.radians(90) + group_index * math.tau / 5
        for branch, delta in (("A", -0.13), ("B", 0.13)):
            spoke = spoke_prism(
                f"WheelSpoke_{code}_{group_index + 1}{branch}",
                x,
                outer_face_y,
                WHEEL_Z,
                base,
                base + delta,
                side,
                rim_mat,
            )
            parent_keep_world(spoke, assembly)

    caliper_x = x + 0.13
    bpy.ops.mesh.primitive_cube_add(location=(caliper_x, outer_face_y - side * 0.04, WHEEL_Z + 0.02))
    caliper = bpy.context.object
    caliper.name = f"BrakeCaliper_{code}"
    caliper.scale = (0.045, 0.032, 0.105)
    caliper.data.materials.append(caliper_mat)
    bevel = caliper.modifiers.new("Caliper bevel", "BEVEL")
    bevel.width = 0.018
    bevel.segments = 4
    mark_model(caliper, "brake")
    parent_keep_world(caliper, assembly)


def volume_from_surface(name, points, offset, mat, group):
    count = len(points)
    verts = [tuple(point) for point in points] + [tuple(Vector(point) + offset) for point in points]
    faces = [tuple(range(count)), tuple(range(count, count * 2))[::-1]]
    faces.extend((i, (i + 1) % count, count + (i + 1) % count, count + i) for i in range(count))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("Lens perimeter", "BEVEL")
    bevel.width = 0.012
    bevel.segments = 4
    return mark_model(obj, group)


def add_lights(head_mat, tail_mat, led_white, led_red):
    for side, suffix in ((1, "L"), (-1, "R")):
        head_points = [
            (2.085, side * 0.34, 0.55),
            (2.035, side * 0.72, 0.59),
            (1.83, side * 0.77, 0.715),
            (1.62, side * 0.52, 0.735),
        ]
        head = volume_from_surface(f"Headlight_{suffix}", head_points, Vector((-0.035, 0, 0)), head_mat, "headlight")
        strip_points = [
            (2.096, side * 0.37, 0.63),
            (2.03, side * 0.68, 0.66),
            (1.82, side * 0.72, 0.70),
        ]
        curve = bpy.data.curves.new(f"HeadlightLED_{suffix}_Curve", "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = 0.012
        curve.bevel_resolution = 3
        spline = curve.splines.new("POLY")
        spline.points.add(len(strip_points) - 1)
        for point, co in zip(spline.points, strip_points):
            point.co = (*co, 1)
        led = bpy.data.objects.new(f"HeadlightLED_{suffix}", curve)
        bpy.context.collection.objects.link(led)
        led.data.materials.append(led_white)
        mark_model(led, "headlight")
        parent_keep_world(led, head)

        tail_points = [
            (-2.10, side * 0.30, 0.64),
            (-2.07, side * 0.71, 0.66),
            (-1.82, side * 0.75, 0.76),
            (-1.70, side * 0.42, 0.77),
        ]
        tail = volume_from_surface(f"TailLight_{suffix}", tail_points, Vector((0.03, 0, 0)), tail_mat, "taillight")
        tail.data.materials.append(led_red)


def flat_panel(name, points, mat, group):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(points, [], [tuple(range(len(points)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return mark_model(obj, group)


def add_front_details(grille_mat, chrome_mat):
    flat_panel(
        "Front_Singleframe_Grille",
        [(2.226, -0.34, 0.24), (2.226, 0.34, 0.24), (2.226, 0.43, 0.66), (2.226, 0.28, 0.79), (2.226, -0.28, 0.79), (2.226, -0.43, 0.66)],
        grille_mat,
        "grille",
    )
    for side, suffix in ((1, "L"), (-1, "R")):
        flat_panel(
            f"Front_Side_Intake_{suffix}",
            [(2.20, side * 0.46, 0.25), (2.18, side * 0.83, 0.28), (2.13, side * 0.80, 0.59), (2.16, side * 0.50, 0.57)],
            grille_mat,
            "grille",
        )
    for index in range(4):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.052,
            minor_radius=0.006,
            major_segments=48,
            minor_segments=10,
            location=(2.236, (index - 1.5) * 0.075, 0.735),
            rotation=(0, math.pi / 2, 0),
        )
        ring = bpy.context.object
        ring.name = f"Audi_Ring_{index + 1}"
        ring.scale.z = 0.72
        ring.data.materials.append(chrome_mat)
        mark_model(ring, "badge")


def add_fuel_door(red_dark):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.083,
        minor_radius=0.006,
        major_segments=64,
        minor_segments=10,
        location=(-1.28, -0.958, 0.79),
        rotation=(math.pi / 2, 0, 0),
    )
    door = bpy.context.object
    door.name = "Fuel_Door_Right_Rear"
    door.data.materials.append(red_dark)
    mark_model(door, "fuel_door")


def setup_studio():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 620
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.world.color = (0.02, 0.023, 0.03)
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -0.014))
    floor = bpy.context.object
    floor.name = "Studio_Floor"
    floor.data.materials.append(material("Studio floor", (0.045, 0.05, 0.06, 1), roughness=0.24))
    for location, energy, size in (
        ((5, -5, 7), 1900, 5.0),
        ((-4, 4, 5), 1300, 4.0),
        ((0, 5, 3), 900, 3.0),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        lamp = bpy.context.object
        lamp.data.energy = energy
        lamp.data.shape = "DISK"
        lamp.data.size = size
        lamp.rotation_euler = (Vector((0, 0, 0.6)) - lamp.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add(location=(6.3, -6.4, 2.7))
    camera = bpy.context.object
    camera.name = "Camera_Hero"
    camera.rotation_euler = (Vector((0, 0, 0.62)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 58
    scene.camera = camera
    return camera


def export_glb():
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.get("export_model"):
            obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )


def main():
    body = load_body()
    red_dark = material("R8 panel seam red", (0.16, 0.003, 0.005, 1), metallic=0.45, roughness=0.24)
    dark = material("Black intake and wheel well", (0.006, 0.008, 0.011, 1), roughness=0.38)
    tire_mat = material("Michelin tire rubber", (0.008, 0.009, 0.011, 1), roughness=0.58)
    rim_mat = material("Titanium machined Y-spoke", (0.24, 0.27, 0.31, 1), metallic=0.94, roughness=0.18)
    disc_mat = material("Ventilated brake steel", (0.22, 0.23, 0.24, 1), metallic=0.9, roughness=0.28)
    caliper_mat = material("R8 black brake caliper", (0.015, 0.017, 0.02, 1), metallic=0.35, roughness=0.2)
    head_mat = material("Headlamp smoked polycarbonate", (0.12, 0.17, 0.21, 0.72), metallic=0.12, roughness=0.08, transmission=0.3)
    tail_mat = material("Tail lamp red polycarbonate", (0.35, 0.003, 0.006, 0.8), roughness=0.1, transmission=0.18)
    led_white = material("LED white", (0.65, 0.82, 1.0, 1), roughness=0.08, emission=(0.65, 0.85, 1.0, 1))
    led_red = material("LED red", (0.5, 0.001, 0.002, 1), roughness=0.08, emission=(1.0, 0.002, 0.003, 1))
    chrome = material("Polished aluminium", (0.63, 0.66, 0.7, 1), metallic=1.0, roughness=0.11)

    add_multiview_vertex_colors(body)
    assign_body_materials(body, multiview_material())
    for x, axle in ((AXLE_X, "F"), (-AXLE_X, "R")):
        for y, side in ((-TRACK_Y, "R"), (TRACK_Y, "L")):
            add_wheel(f"{axle}{side}", x, y, tire_mat, rim_mat, disc_mat, caliper_mat)
    add_lights(head_mat, tail_mat, led_white, led_red)
    # The learned mesh already carries the grille and rings from the projected
    # front view; separate overlay panels would hide that higher fidelity data.
    add_fuel_door(red_dark)
    setup_studio()

    bpy.context.scene["base_generator"] = "tencent/Hunyuan3D-2mv, 4 canonical views, seed 5200"
    bpy.context.scene["target_dimensions_m"] = "4.440 x 1.905 x 1.245; wheelbase 2.649"
    bpy.context.scene["separate_parts"] = "Body; Tire x4; Wheel x4; Headlight L/R; TailLight L/R; Fuel door"
    export_glb()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))
    bpy.context.scene.render.filepath = str(WORK / "r8-type42-hunyuan-rebuild-hero.png")
    bpy.ops.render.render(write_still=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"OUTPUT_GLB={OUTPUT_GLB}")


if __name__ == "__main__":
    main()
