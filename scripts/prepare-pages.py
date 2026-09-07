"""Prepare gh-pages from dist without changing the checkout or pushing remotely."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'

def git(*args, env=None, cwd=root):
    return subprocess.check_output(['git', *args], cwd=cwd, env=env, text=True, timeout=30).strip()

if git('status', '--porcelain'):
    raise SystemExit('Faça o commit das mudanças antes de preparar a publicação.')
for name in ['index.html', '.nojekyll', 'models/fusca.glb', 'models/fusca-manifest.json']:
    if not (dist / name).is_file():
        raise SystemExit(f'Build incompleto: falta {name}. Execute npm run build.')
if (dist / 'models/fusca.glb').read_bytes() != (root / 'public/models/fusca.glb').read_bytes():
    raise SystemExit('O modelo do build está desatualizado. Execute npm run build.')

source = git('rev-parse', 'HEAD')
(dist / 'release.json').write_text(json.dumps({'sourceCommit': source}) + '\n')
parent = subprocess.run(['git', 'rev-parse', '--verify', 'refs/heads/gh-pages'], cwd=root,
                        capture_output=True, text=True, timeout=10)
previous = parent.stdout.strip() if parent.returncode == 0 else None
with tempfile.TemporaryDirectory(prefix='fusquinha-pages-') as directory:
    env = dict(os.environ, GIT_DIR=str(root / '.git'), GIT_WORK_TREE=str(dist),
               GIT_INDEX_FILE=str(Path(directory) / 'index'))
    git('read-tree', '--empty', env=env)
    git('add', '--all', '--', '.', ':(glob,exclude)**/.DS_Store',
        ':(glob,exclude)**/._*', env=env, cwd=dist)
    tree = git('write-tree', env=env)
    args = ['commit-tree', tree, '-m', f'deploy: Fusquinha {source[:7]}']
    if previous:
        args += ['-p', previous]
    commit = git(*args)
    git('update-ref', 'refs/heads/gh-pages', commit, previous or '0' * 40)
print(f'gh-pages preparado: {commit[:7]} (fonte {source[:7]}).')
print('Para publicar: git push origin main gh-pages')
