# Audi R8 Type 42 facelift Spyder reconstruction

This workspace converts a legally downloadable Type 42 facelift base mesh into
the red Spyder shown in the supplied photographs. The source model itself is not
committed to Git.

## Required source

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

