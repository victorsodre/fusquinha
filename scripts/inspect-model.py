"""Run with blender --background --factory-startup --disable-autoexec --python ..."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

bpy.ops.wm.open_mainfile(filepath='/private/tmp/fusca-source.blend', use_scripts=False)
report = []
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    points = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    report.append({
        'name': obj.name,
        'vertices': len(obj.data.vertices),
        'polygons': len(obj.data.polygons),
        'min': [round(min(p[i] for p in points), 4) for i in range(3)],
        'max': [round(max(p[i] for p in points), 4) for i in range(3)],
        'materials': [m.name if m else None for m in obj.data.materials],
        'modifiers': [(m.name, m.type) for m in obj.modifiers],
        'hidden': obj.hide_render,
    })
Path('/private/tmp/fusca-mesh-report.json').write_text(json.dumps(report, indent=2))
print('INSPECTION', len(report), 'meshes;', sum(r['polygons'] for r in report), 'polygons')
print('MATERIALS', [(m.name, list(m.diffuse_color)) for m in bpy.data.materials])
