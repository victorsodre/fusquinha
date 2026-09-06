"""Create the local web derivative; never run scripts embedded in the source blend."""
import bpy
import json
import math
from pathlib import Path
from collections import Counter
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath='/private/tmp/fusca-separated.blend', use_scripts=False)
records = {r['name']: r for r in json.loads(Path('/private/tmp/fusca-split-report.json').read_text())}

def srgb(value):
    return value / 12.92 if value < .04045 else ((value + .055) / 1.055) ** 2.4

def color(hex_value):
    return tuple(srgb(int(hex_value[i:i+2], 16) / 255) for i in (0, 2, 4)) + (1,)

# Reconnect baked maps directly: the original Blender Mix nodes are not portable to glTF.
for mat in list(bpy.data.materials):
    original = [(n.label, n.image) for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image]
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(shader.outputs['BSDF'], out.inputs['Surface'])
    shader.inputs['Roughness'].default_value = .38
    def texture(image, target, normal=False):
        tex = nodes.new('ShaderNodeTexImage'); tex.image = image
        if normal:
            n = nodes.new('ShaderNodeNormalMap')
            n.inputs['Strength'].default_value = .4
            links.new(tex.outputs['Color'], n.inputs['Color'])
            links.new(n.outputs['Normal'], shader.inputs['Normal'])
        else:
            links.new(tex.outputs['Color'], shader.inputs[target])
    if mat.name == '1-Body':
        mat.name = 'Pintura_Amarelo_Solar'
        shader.inputs['Base Color'].default_value = color('EDBC28')
        shader.inputs['Metallic'].default_value = .24
        shader.inputs['Roughness'].default_value = .26
        shader.inputs['Coat Weight'].default_value = .4
        shader.inputs['Coat Roughness'].default_value = .2
        continue
    if mat.name == '6-Glass Windows':
        shader.inputs['Base Color'].default_value = color('819C99')
        shader.inputs['Alpha'].default_value = .28
        shader.inputs['Metallic'].default_value = .1
        shader.inputs['Roughness'].default_value = .13
        mat.surface_render_method = 'DITHERED'
        continue
    for label, img in original:
        name = img.name.lower()
        if 'base_color' in name:
            texture(img, 'Base Color')
        elif label == 'Metallic':
            texture(img, 'Metallic')
        elif label == 'Roughness':
            texture(img, 'Roughness')
        elif label == 'Normal':
            texture(img, 'Normal', normal=True)

def classify(r):
    source = r['source']
    x, y, z = r['center']
    size = [r['max'][i] - r['min'][i] for i in range(3)]
    side = 'direito' if x > 0 else 'esquerdo'
    end = 'dianteiro' if y < 0 else 'traseiro'
    if source.startswith('Tires'):
        return 'wheels', f'Pneu {end} {side}'
    if source.startswith('Wheels'):
        return 'wheels', f'Roda {end[:-1]}a {side[:-1]}a' if r['faces'] > 2000 else f'Detalhe da roda · {end} {side}'
    if source == 'Engine':
        return 'engine', 'Elemento do motor boxer'
    if source == 'Exhaust Suspensao':
        return 'mechanical', 'Escapamento' if y > 1.4 else 'Elemento da suspensão e transmissão'
    if source == 'Glass':
        if z < .9:
            return 'trim', 'Lente do farol' if y < 0 else 'Lente da lanterna'
        return 'glass', ('Para-brisa' if y < -.5 else 'Vidro traseiro') if abs(x) < .1 else f'Vidro lateral {side}'
    if source == 'Interior Acessorios':
        return 'interior', 'Detalhe do painel e comandos'
    if source == 'Interior Upholstered':
        return 'interior', 'Banco e acabamento interno'
    if source == 'Body Bumper Under':
        return ('chassis', 'Plataforma e estrutura inferior') if size[1] > 3 else ('trim', f'Para-choque e suporte · {end}')
    if source == 'Body':
        if size[1] > 2:
            return 'body', 'Carroceria principal'
        if size[0] > 1 and y < -.5:
            return 'body', 'Capô dianteiro' if r['faces'] > 500 else 'Reforço do capô'
        if abs(x) > .5 and -.5 < y < .2 and size[2] > .7:
            return 'doors', f'Porta {side[:-1]}a'
        if y > 1.45 and size[0] > .8:
            return 'body', 'Tampa do motor' if r['faces'] > 500 else 'Reforço da tampa traseira'
        if abs(x) > .4 and size[1] > 1:
            return 'body', f'Para-lama {end} {side}'
        if r['faces'] < 600 and max(size) < .15:
            return 'doors', 'Dobradiça e fixação'
        return 'body', 'Painel e detalhe da carroceria'
    return 'trim', 'Friso e acabamento externo'

manifest = []
objects = sorted([o for o in bpy.context.scene.objects if o.type == 'MESH'], key=lambda o: o.name)
label_counts = Counter()
plate_material = bpy.data.materials.new('Placa_Cenografica_SP')
plate_material.use_nodes = True
plate_shader = plate_material.node_tree.nodes.get('Principled BSDF')
plate_shader.inputs['Roughness'].default_value = .65
plate_texture = plate_material.node_tree.nodes.new('ShaderNodeTexImage')
plate_texture.image = bpy.data.images.load(str(ROOT/'public/models/plate.png'))
plate_material.node_tree.links.new(plate_texture.outputs['Color'], plate_shader.inputs['Base Color'])
for index, obj in enumerate(objects):
    r = records[obj.name]
    group, label = classify(r)
    if r['name'] in ('Body Bumper Under.023', 'Body Bumper Under.025'):
        front = r['center'][1] < 0
        location = tuple(r['center'])
        bpy.ops.mesh.primitive_plane_add(size=2, location=location)
        plane = bpy.context.object
        plane.rotation_euler = (math.pi / 2, 0, 0 if front else math.pi)
        plane.scale = (.158, .052, 1)
        plane.location.y += -.012 if front else .012
        obj.data = plane.data.copy()
        obj.location = plane.location.copy()
        obj.rotation_euler = plane.rotation_euler.copy()
        obj.scale = plane.scale.copy()
        bpy.data.objects.remove(plane, do_unlink=True)
        obj.data.materials.clear(); obj.data.materials.append(plate_material)
        label = 'Placa cenográfica ' + ('dianteira' if front else 'traseira')
        r['source'] = 'Fusquinha'
        r['faces'] = len(obj.data.polygons)
    label_counts[label] += 1
    base_label = label
    if label_counts[label] > 1:
        label += f' {label_counts[label]:02}'
    obj.name = f'piece_{index:03}'
    # Only intentionally authored metadata is retained in the web derivative.
    for key in list(obj.keys()):
        del obj[key]
    obj['pieceId'] = obj.name
    obj['group'] = group
    obj['label'] = label
    obj['sourceObject'] = r['source']
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    manifest.append({'id': obj.name, 'group': group, 'label': label, 'descriptionKey': base_label,
        'sourceObject': r['source'], 'faces': r['faces']})

# Brazilian reading of the classic steel wheels: four domed chrome hubcaps.
hubcap = bpy.data.materials.new('Calota_Cromada'); hubcap.use_nodes = True
shader = hubcap.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value = color('D6D6D2')
shader.inputs['Metallic'].default_value = .95
shader.inputs['Roughness'].default_value = .18
for y in (-1.2771, 1.0489):
    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=(side*.735, y, .334))
        obj = bpy.context.object; obj.name = f'piece_{len(manifest):03}'
        obj.scale = (.042, .169, .169)
        obj.data.materials.append(hubcap)
        for polygon in obj.data.polygons: polygon.use_smooth = True
        label = f'Calota cromada · {"dianteira" if y < 0 else "traseira"} {"direita" if side > 0 else "esquerda"}'
        obj['pieceId'] = obj.name; obj['group'] = 'wheels'; obj['label'] = label; obj['sourceObject'] = 'Fusquinha'
        manifest.append({'id': obj.name, 'group': 'wheels', 'label': label, 'descriptionKey': 'Calota cromada',
            'sourceObject': 'Fusquinha', 'faces': len(obj.data.polygons)})

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

for item in manifest:
    obj = bpy.data.objects[item['id']]
    points = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    # Blender Z-up to glTF Y-up.
    points = [Vector((p.x, p.z, -p.y)) for p in points]
    item['min'] = [min(p[i] for p in points) for i in range(3)]
    item['max'] = [max(p[i] for p in points) for i in range(3)]
    item['center'] = [(item['min'][i]+item['max'][i])/2 for i in range(3)]

output = ROOT/'public/models'
output.mkdir(exist_ok=True, parents=True)
(output/'fusca-manifest.json').write_text(json.dumps({
    'name': 'Fusca — edição amarelinho',
    'sourceYear': 1965,
    'author': 'Rodrigo Marini',
    'source': 'https://www.blendkit.com/asset-gallery-detail/e8a58537-3114-4962-a5c5-60fdb0346f1c/',
    'license': 'BlenderKit Royalty Free',
    'licenseUrl': 'https://www.blendkit.com/docs/licenses/',
    'changes': 'Pintura amarela, calotas cromadas, placas cenográficas de São Paulo, separação de ilhas, materiais para glTF e catalogação em português.',
    'scope': 'Geometria artística para estudo visual. Não é um catálogo OEM nem CAD de fabricação. Releitura brasileira de um asset de 1965.',
    'objects': manifest
}, ensure_ascii=False, indent=2))

bpy.context.scene['attribution'] = 'VolksWagen Beetle by Rodrigo Marini, BlenderKit Royalty Free; modified for Fusquinha.'
bpy.ops.export_scene.gltf(filepath=str(output/'fusca.glb'), export_format='GLB', export_extras=True,
    export_cameras=False, export_lights=False, export_animations=False, export_image_format='JPEG',
    export_jpeg_quality=85, export_yup=True)
print('EXPORTED', len(manifest), 'pieces;', (output/'fusca.glb').stat().st_size, 'bytes')
