"""Download the publicly offered free asset through the documented BlenderKit workflow.

Never prints signed file URLs. Refuses paid assets or a changed license.
"""
import json
import subprocess
import urllib.request
import uuid
from pathlib import Path

BASE_ID = 'e8a58537-3114-4962-a5c5-60fdb0346f1c'
TARGET = Path('/private/tmp/fusca-source.blend')

def read_json(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.load(response)

data = read_json(f'https://www.blenderkit.com/api/v1/search/?query=asset_base_id:{BASE_ID}')
asset = next((r for r in data['results'] if r['assetBaseId'] == BASE_ID), None)
if not asset or not asset['isFree'] or asset['license'] != 'royalty_free':
    raise SystemExit('O asset ou sua licença mudaram. Confira a origem antes de continuar.')
file = next(f for f in asset['files'] if f['fileType'] == 'resolution_1K')
download = read_json(file['downloadUrl'] + '?scene_uuid=' + str(uuid.uuid4()))
if not download.get('filePath'):
    raise SystemExit('O servidor não autorizou o download.')
result = subprocess.run(['curl', '-sSL', '--fail', '--max-time', '120', '--max-filesize', '100000000',
    download['filePath'], '-o', str(TARGET)], capture_output=True)
if result.returncode:
    raise SystemExit(f'Download não concluído (curl {result.returncode}).')
print(f'Fusca de Rodrigo Marini salvo em {TARGET} ({TARGET.stat().st_size:,} bytes).')
