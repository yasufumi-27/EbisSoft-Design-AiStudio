"""Build an editable R8 Type 42 base mesh from the generated eight-view sprite.

The body is a multi-view visual hull. Wheels, tires, headlamps and tail lamps are
created as separate objects so they can be refined and exported independently.
"""

from __future__ import annotations

import json
import math
from collections import deque
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
PIPELINE = ROOT / "tools" / "blender" / "r8_type42"
WORK = PIPELINE / "work"
MASK_DIR = WORK / "masks"
SPRITE = ROOT / "public" / "images" / "audi-r8-type42-360-sprite.png"
TARGET = json.loads((PIPELINE / "target.json").read_text(encoding="utf-8"))

LENGTH = TARGET["dimensions_m"]["length"]
WIDTH = TARGET["dimensions_m"]["width"]
HEIGHT = TARGET["dimensions_m"]["height"]
WHEELBASE = TARGET["dimensions_m"]["wheelbase"]
FRAME_NAMES = ("front", "front_right", "right", "rear_right", "rear", "rear_left", "left", "front_left")
VIEW_ANGLES = tuple(math.radians(index * 45.0) for index in range(8))
MASK_SIZE = 192
GRID = (112, 52, 42)


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.name != "Collection" and collection.users == 0:
            bpy.data.collections.remove(collection)


def material(name: str, color: tuple[float, float, float, float], *, metallic=0.0, roughness=0.4, transmission=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if emission:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = 2.5
    return mat


def read_sprite() -> tuple[int, int, list[float]]:
    image = bpy.data.images.load(str(SPRITE), check_existing=False)
    width, height = image.size
    return width, height, list(image.pixels[:])


def pixel(data: list[float], width: int, height: int, x: int, y_top: int) -> tuple[float, float, float]:
    y = height - 1 - max(0, min(height - 1, y_top))
    x = max(0, min(width - 1, x))
    index = (y * width + x) * 4
    return data[index], data[index + 1], data[index + 2]


def frame_bounds(width: int, height: int, index: int) -> tuple[int, int, int, int]:
    column, row = index % 4, index // 4
    return (
        round(column * width / 4),
        round(row * height / 2),
        round((column + 1) * width / 4),
        round((row + 1) * height / 2),
    )


def build_mask(data: list[float], width: int, height: int, index: int) -> list[list[bool]]:
    x0, y0, x1, y1 = frame_bounds(width, height, index)
    red = [[False] * MASK_SIZE for _ in range(MASK_SIZE)]
    candidate = [[False] * MASK_SIZE for _ in range(MASK_SIZE)]

    for my in range(MASK_SIZE):
        sy = y0 + int((my + 0.5) * (y1 - y0) / MASK_SIZE)
        bg_samples = [pixel(data, width, height, x0 + 4, sy), pixel(data, width, height, x1 - 5, sy)]
        bg_luma = sum(sum(sample) / 3 for sample in bg_samples) / 2
        for mx in range(MASK_SIZE):
            sx = x0 + int((mx + 0.5) * (x1 - x0) / MASK_SIZE)
            r, g, b = pixel(data, width, height, sx, sy)
            maximum, minimum = max(r, g, b), min(r, g, b)
            saturation = maximum - minimum
            luma = (r + g + b) / 3
            is_red = r > 0.28 and r > g * 1.35 and r > b * 1.28 and saturation > 0.12
            red[my][mx] = is_red
            candidate[my][mx] = is_red or saturation > 0.075 or luma < bg_luma - 0.075

    red_points = [(x, y) for y in range(MASK_SIZE) for x in range(MASK_SIZE) if red[y][x]]
    if not red_points:
        raise RuntimeError(f"No red body pixels detected in frame {index}")
    min_x = max(0, min(x for x, _ in red_points) - 12)
    max_x = min(MASK_SIZE - 1, max(x for x, _ in red_points) + 12)
    min_y = max(0, min(y for _, y in red_points) - 10)
    max_y = min(MASK_SIZE - 1, max(y for _, y in red_points) + 24)

    # Keep only candidate pixels connected to the red body. This retains glass,
    # grilles and wheels but rejects the studio background.
    seeds = deque(red_points[:: max(1, len(red_points) // 5000)])
    connected = [[False] * MASK_SIZE for _ in range(MASK_SIZE)]
    while seeds:
        x, y = seeds.popleft()
        if not (min_x <= x <= max_x and min_y <= y <= max_y):
            continue
        if connected[y][x] or not candidate[y][x]:
            continue
        connected[y][x] = True
        if x > 0:
            seeds.append((x - 1, y))
        if x + 1 < MASK_SIZE:
            seeds.append((x + 1, y))
        if y > 0:
            seeds.append((x, y - 1))
        if y + 1 < MASK_SIZE:
            seeds.append((x, y + 1))

    # Convert each occupied column to a solid silhouette. Thin floor shadows are
    # capped to the lowest substantial run instead of expanding the hull.
    mask = [[False] * MASK_SIZE for _ in range(MASK_SIZE)]
    for x in range(min_x, max_x + 1):
        ys = [y for y in range(min_y, max_y + 1) if connected[y][x]]
        if not ys:
            continue
        top = min(ys)
        bottom = max(ys)
        for y in range(top, bottom + 1):
            mask[y][x] = True
    return mask


def save_mask(mask: list[list[bool]], name: str) -> None:
    image = bpy.data.images.new(name, width=MASK_SIZE, height=MASK_SIZE, alpha=True)
    pixels = [0.0] * (MASK_SIZE * MASK_SIZE * 4)
    for y_top in range(MASK_SIZE):
        y = MASK_SIZE - 1 - y_top
        for x in range(MASK_SIZE):
            value = 1.0 if mask[y_top][x] else 0.0
            idx = (y * MASK_SIZE + x) * 4
            pixels[idx:idx + 4] = (value, value, value, 1.0)
    image.pixels = pixels
    image.filepath_raw = str(MASK_DIR / f"{name}.png")
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)


def mask_bounds(mask: list[list[bool]]) -> tuple[int, int, int, int]:
    points = [(x, y) for y, row in enumerate(mask) for x, occupied in enumerate(row) if occupied]
    return min(x for x, _ in points), min(y for _, y in points), max(x for x, _ in points), max(y for _, y in points)


def sample_mask(mask: list[list[bool]], bounds: tuple[int, int, int, int], u: float, z: float, half_u: float) -> bool:
    min_x, min_y, max_x, max_y = bounds
    px = min_x + (u / (2 * half_u) + 0.5) * (max_x - min_x)
    py = max_y - (z / HEIGHT) * (max_y - min_y)
    ix, iy = round(px), round(py)
    if not (0 <= ix < MASK_SIZE and 0 <= iy < MASK_SIZE):
        return False
    return mask[iy][ix]


def in_wheel_arch(x: float, y: float, z: float) -> bool:
    if abs(y) < WIDTH * 0.31:
        return False
    wheel_x = WHEELBASE * 0.5
    return min((x - wheel_x) ** 2, (x + wheel_x) ** 2) + (z - 0.34) ** 2 < 0.39 ** 2


def create_visual_hull(masks: list[list[list[bool]]], body_mat: bpy.types.Material) -> bpy.types.Object:
    nx, ny, nz = GRID
    dx, dy, dz = LENGTH / nx, WIDTH / ny, HEIGHT / nz
    bounds = [mask_bounds(mask) for mask in masks]
    occupied: set[tuple[int, int, int]] = set()
    for ix in range(nx):
        x = -LENGTH / 2 + (ix + 0.5) * dx
        for iy in range(ny):
            y = -WIDTH / 2 + (iy + 0.5) * dy
            for iz in range(nz):
                z = (iz + 0.5) * dz
                if in_wheel_arch(x, y, z):
                    continue
                inside = True
                for angle, mask, frame_bounds_ in zip(VIEW_ANGLES, masks, bounds):
                    u = -math.sin(angle) * x + math.cos(angle) * y
                    half_u = abs(math.sin(angle)) * LENGTH / 2 + abs(math.cos(angle)) * WIDTH / 2
                    if not sample_mask(mask, frame_bounds_, u, z, half_u):
                        inside = False
                        break
                if inside:
                    occupied.add((ix, iy, iz))

    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    vertex_map: dict[tuple[int, int, int], int] = {}

    def vertex(grid_point: tuple[int, int, int]) -> int:
        found = vertex_map.get(grid_point)
        if found is not None:
            return found
        gx, gy, gz = grid_point
        result = len(vertices)
        vertices.append((-LENGTH / 2 + gx * dx, -WIDTH / 2 + gy * dy, gz * dz))
        vertex_map[grid_point] = result
        return result

    directions = (
        ((1, 0, 0), ((1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1))),
        ((-1, 0, 0), ((0, 1, 0), (0, 0, 0), (0, 0, 1), (0, 1, 1))),
        ((0, 1, 0), ((1, 1, 0), (0, 1, 0), (0, 1, 1), (1, 1, 1))),
        ((0, -1, 0), ((0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1))),
        ((0, 0, 1), ((0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1))),
        ((0, 0, -1), ((0, 1, 0), (1, 1, 0), (1, 0, 0), (0, 0, 0))),
    )
    for ix, iy, iz in occupied:
        for (ox, oy, oz), corners in directions:
            if (ix + ox, iy + oy, iz + oz) in occupied:
                continue
            faces.append(tuple(vertex((ix + cx, iy + cy, iz + cz)) for cx, cy, cz in corners))

    mesh = bpy.data.meshes.new("R8_Body_VisualHull_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    body = bpy.data.objects.new("R8_Body_VisualHull", mesh)
    bpy.context.collection.objects.link(body)
    body.data.materials.append(body_mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = body.modifiers.new("Body surface softening", "BEVEL")
    bevel.width = min(dx, dy, dz) * 0.8
    bevel.segments = 2
    return body


def cylinder_part(name: str, radius: float, depth: float, location, mat, vertices=64) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=(math.pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def add_wheel(name: str, x: float, y: float, tire_mat, rim_mat, brake_mat) -> None:
    side = 1 if y > 0 else -1
    tire = None
    bpy.ops.mesh.primitive_torus_add(major_radius=0.277, minor_radius=0.062, major_segments=64, minor_segments=20, location=(x, y, 0.34), rotation=(math.pi / 2, 0, 0))
    tire = bpy.context.object
    tire.name = f"Tire_{name}"
    tire.scale.y = 1.22
    tire.data.materials.append(tire_mat)
    rim = cylinder_part(f"Wheel_Rim_{name}", 0.255, 0.105, (x, y - side * 0.008, 0.34), rim_mat)
    disc = cylinder_part(f"Brake_Disc_{name}", 0.19, 0.112, (x, y, 0.34), brake_mat, vertices=48)

    # Ten spokes arranged as five paired Y groups, matching the supplied wheel.
    for index in range(10):
        angle = index * math.tau / 10
        bpy.ops.mesh.primitive_cube_add(location=(x, y - side * 0.065, 0.34))
        spoke = bpy.context.object
        spoke.name = f"Wheel_Spoke_{name}_{index + 1:02d}"
        spoke.scale = (0.026, 0.025, 0.19)
        spoke.rotation_euler[1] = angle
        spoke.data.materials.append(rim_mat)
        bevel = spoke.modifiers.new("Spoke bevel", "BEVEL")
        bevel.width = 0.015
        bevel.segments = 3
    hub = cylinder_part(f"Wheel_Hub_{name}", 0.055, 0.13, (x, y - side * 0.075, 0.34), rim_mat, vertices=48)
    for obj in (tire, rim, disc, hub):
        obj["part_group"] = "wheel"


def prism_from_outline(name: str, outline: list[tuple[float, float]], y: float, thickness: float, mat) -> bpy.types.Object:
    # Outline coordinates are longitudinal x / vertical z. Extrude across y.
    vertices = [(x, y - thickness / 2, z) for x, z in outline] + [(x, y + thickness / 2, z) for x, z in outline]
    count = len(outline)
    faces = [tuple(range(count)), tuple(range(count, count * 2))[::-1]]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("Lens edge", "BEVEL")
    bevel.width = 0.012
    bevel.segments = 3
    return obj


def add_lights(headlight_mat, tail_mat) -> None:
    # These are independent editable lens volumes; the refinement pass will snap
    # their inner vertices to the final body surface.
    head_outline = [(2.01, 0.55), (2.18, 0.61), (2.13, 0.73), (1.82, 0.70), (1.72, 0.61)]
    tail_outline = [(-2.06, 0.64), (-1.82, 0.65), (-1.70, 0.75), (-2.05, 0.76)]
    for side, suffix in ((-1, "L"), (1, "R")):
        head = prism_from_outline(f"Headlight_{suffix}", head_outline, side * 0.68, 0.23, headlight_mat)
        tail = prism_from_outline(f"TailLight_{suffix}", tail_outline, side * 0.68, 0.24, tail_mat)
        head["part_group"] = "front_light"
        tail["part_group"] = "rear_light"


def setup_scene() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.world.color = (0.035, 0.035, 0.045)

    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -0.012))
    floor = bpy.context.object
    floor.name = "Studio_Floor"
    floor.data.materials.append(material("Studio floor", (0.055, 0.06, 0.07, 1), roughness=0.23))

    for location, energy, size in (((4, -5, 7), 1700, 5.0), ((-4, 3, 5), 1100, 4.0), ((0, 5, 3), 900, 3.0)):
        bpy.ops.object.light_add(type="AREA", location=location)
        lamp = bpy.context.object
        lamp.data.energy = energy
        lamp.data.shape = "DISK"
        lamp.data.size = size
        lamp.rotation_euler = (math.radians(30), 0, math.atan2(-location[1], -location[0]))

    bpy.ops.object.camera_add(location=(6.8, -7.4, 3.7))
    camera = bpy.context.object
    camera.name = "Camera_Hero"
    direction = Vector((0, 0, 0.62)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 60
    scene.camera = camera


def main() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    MASK_DIR.mkdir(parents=True, exist_ok=True)
    reset_scene()
    width, height, pixels = read_sprite()
    masks = [build_mask(pixels, width, height, index) for index in range(8)]
    for name, mask in zip(FRAME_NAMES, masks):
        save_mask(mask, name)

    body_mat = material("R8 Brilliant Red", (0.62, 0.008, 0.012, 1), metallic=0.58, roughness=0.17)
    tire_mat = material("Tire rubber", (0.012, 0.014, 0.016, 1), roughness=0.56)
    rim_mat = material("Titanium Y-spoke wheel", (0.23, 0.25, 0.28, 1), metallic=0.92, roughness=0.2)
    brake_mat = material("Brake steel", (0.17, 0.18, 0.19, 1), metallic=0.85, roughness=0.3)
    headlight_mat = material("LED headlight lens", (0.48, 0.65, 0.76, 0.32), metallic=0.08, roughness=0.08, transmission=0.5, emission=(0.55, 0.75, 1.0, 1))
    tail_mat = material("LED tail lamp lens", (0.45, 0.002, 0.006, 0.7), roughness=0.12, transmission=0.2, emission=(1.0, 0.01, 0.005, 1))

    body = create_visual_hull(masks, body_mat)
    body["construction"] = "eight-view visual hull"
    axle = WHEELBASE / 2
    track_y = 0.82
    add_wheel("FL", axle, -track_y, tire_mat, rim_mat, brake_mat)
    add_wheel("FR", axle, track_y, tire_mat, rim_mat, brake_mat)
    add_wheel("RL", -axle, -track_y, tire_mat, rim_mat, brake_mat)
    add_wheel("RR", -axle, track_y, tire_mat, rim_mat, brake_mat)
    add_lights(headlight_mat, tail_mat)
    setup_scene()

    scene = bpy.context.scene
    scene["model_method"] = "Visual hull from 8 generated views, then Blender surface reconstruction"
    scene["separate_parts"] = "Body; Tire x4; Wheel x4; Headlight L/R; TailLight L/R"
    scene.render.filepath = str(WORK / "visual-hull-preview.png")
    bpy.ops.wm.save_as_mainfile(filepath=str(WORK / "r8-type42-visual-hull.blend"))
    bpy.ops.render.render(write_still=True)
    print(f"VISUAL_HULL_BODY_VERTICES={len(body.data.vertices)}")
    print(f"VISUAL_HULL_BODY_FACES={len(body.data.polygons)}")


if __name__ == "__main__":
    main()
