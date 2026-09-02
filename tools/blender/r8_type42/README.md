# Audi R8 Type 42 facelift Spyder reconstruction

This workspace reconstructs the red Type 42 facelift Spyder from the generated
eight-view image sheet. The base mesh comes from the free, local
`tencent/Hunyuan3D-2mv` multiview model. Blender is used for dimensional
correction, controlled body panels, separate components and final materials.

## Primary reconstruction

The local generator and Python 3.12 virtual environment live outside both the
production repository and this GitHub Pages preview repository:

- `/Users/yasufumi/_work/.ebissoft-tools/Hunyuan3D-2`
- `/Users/yasufumi/_work/.ebissoft-tools/hunyuan3d-venv`

Prepare the four canonical model inputs and all eight QA views:

```bash
PYTHON=/Users/yasufumi/_work/.ebissoft-tools/hunyuan3d-venv/bin/python
$PYTHON tools/blender/r8_type42/prepare_hunyuan_views.py \
  --sprite public/images/audi-r8-type42-360-sprite.png \
  --output tools/blender/r8_type42/work/views
```

Generate the learned base mesh on Apple Silicon:

```bash
PYTORCH_ENABLE_MPS_FALLBACK=1 $PYTHON \
  tools/blender/r8_type42/generate_hunyuan_mv.py \
  --views tools/blender/r8_type42/work/views/hunyuan-mv \
  --output tools/blender/r8_type42/work/r8-hunyuan-base-256.glb \
  --steps 30 --resolution 256 --seed 5200
```

The Hunyuan inputs use front, right profile, back and left profile. The four
diagonal views are held out for Blender comparison renders rather than passed
with incorrect camera tags.

## Silhouette QA cage

Run:

```bash
blender --background --python tools/blender/r8_type42/build_visual_hull.py
```

The script segments all eight views, saves their masks and intersects the views
to create a full-scale visual hull. This is not the primary mesh; it is a
dimension and silhouette comparison cage for the learned mesh. It also creates
the initial separate tire, wheel and lamp placeholders. It writes:

- `work/r8-type42-visual-hull.blend`
- `work/visual-hull-preview.png`
- `work/masks/*.png`

Blender refinement replaces Hunyuan's fused wheel and lamp regions with
controlled separate parts, then adds the grille, cabin and Spyder deck details.

## Optional topology reference

- Model: `Audi R8 V10 (Type 42)` by Mona x Supercars / Car2022
- URL: https://sketchfab.com/3d-models/audi-r8-v10-type-42-7463fcd44a00428486c09487f7fcda0c
- License: CC BY 4.0 (commercial use allowed with attribution)
- Expected source: the downloaded Sketchfab archive, extracted anywhere under
  `tools/blender/r8_type42/source/`

The base is the facelift coupe rather than the Spyder. It was selected because
its headlamps, hexagonal grille, bumper openings and body surfacing match the
target car. The roof, rear deck and cabin will be rebuilt after inspecting the
downloaded topology.

## Target dimensions

- Length: 4.440 m
- Width: 1.905 m
- Height: 1.245 m
- Wheelbase: 2.649 m
- Front tires: 235/35 R19
- Rear tires: 305/30 R19 (V10 order guide; confirm target fitment visually)

## Target-specific checklist

- Facelift front bumper and LED headlamp shape
- Red open-top Spyder body with aluminium-look windscreen surround
- Beige two-seat interior and black dashboard
- Five paired Y-spoke / ten-spoke wheels in dark titanium silver
- Black front and side intake mesh
- Circular fuel filler door on the right rear shoulder
- Spyder rear deck, twin headrest fairings, rear vents and heated rear glass
- Facelift tail lamps, black rear grille, round twin exhausts and diffuser
- Separate paint, glass, lamp, grille, tire, wheel, brake and interior materials

## Pipeline

After the archive is extracted, run:

```bash
blender --background --python tools/blender/r8_type42/import_and_audit.py
```

It imports the source, scales it to the target length, writes an audit report,
and saves `tools/blender/r8_type42/work/r8-type42-source-audit.blend`. The next
stage uses the actual object/material names from that report to rebuild the
Spyder-specific parts without guessing the mesh topology.
