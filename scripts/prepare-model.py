"""Prepare a derived viewer asset, preserving attribution in extras and manifest.

Usage: blender -b --factory-startup --disable-autoexec -t 2 --python scripts/prepare-model.py
The source download stays outside the repository.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath='/private/tmp/fusca-source.blend', use_scripts=False)

for obj in list(bpy.data.objects):
    if obj.type != 'MESH':
        bpy.data.objects.remove(obj, do_unlink=True)

for obj in list(bpy.data.objects):
    obj['source_object'] = obj.name.strip()
    obj.modifiers.clear()

materials = []
for mat in bpy.data.materials:
    info = {'name': mat.name, 'images': []}
    if mat.node_tree:
        for node in mat.node_tree.nodes:
            if node.type == 'TEX_IMAGE' and node.image:
                info['images'].append({'node': node.name, 'label': node.label, 'image': node.image.name,
                    'links': [(link.to_node.name, link.to_socket.name) for link in node.outputs[0].links]})
    materials.append(info)
Path('/private/tmp/fusca-material-report.json').write_text(json.dumps(materials, indent=2))

bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='LOOSE')
bpy.ops.object.mode_set(mode='OBJECT')

records = []
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    points = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    lo = [min(p[i] for p in points) for i in range(3)]
    hi = [max(p[i] for p in points) for i in range(3)]
    center = [(lo[i] + hi[i])/2 for i in range(3)]
    records.append({'name': obj.name, 'source': obj['source_object'], 'faces': len(obj.data.polygons),
        'min': [round(x, 4) for x in lo], 'max': [round(x, 4) for x in hi],
        'center': [round(x, 4) for x in center],
        'materials': [m.name if m else '' for m in obj.data.materials]})
Path('/private/tmp/fusca-split-report.json').write_text(json.dumps(records, indent=2))
bpy.ops.wm.save_as_mainfile(filepath='/private/tmp/fusca-separated.blend')
print('PREPARED', len(records), 'mesh islands')
