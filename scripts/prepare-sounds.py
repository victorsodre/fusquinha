"""Create short local cues without changing the source episode files."""
import argparse
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path, help='Folder containing the four original MP3 effects')
source = parser.parse_args().source
output = Path(__file__).resolve().parents[1] / 'public/audio/sfx'
cuts = [
    ('headlights-on', 'farol-interruptor.mp3', .10, .55, 2),
    ('headlights-off', 'farol-interruptor.mp3', 2.25, .65, 2),
    ('door-open', 'porta-generica-abrir-fechar.mp3', .65, 1.1, 3),
    ('door-close', 'porta-generica-abrir-fechar.mp3', 2.75, .7, 1),
    ('hazards', 'pisca-rele.mp3', 1.50, .73, 5),
    ('wipers', 'limpadores-parabrisa.mp3', 1.63, 1.4, 1),
]
for _, filename, *_ in cuts:
    if not (source / filename).is_file():
        raise SystemExit(f'Missing source: {filename}')
output.mkdir(parents=True, exist_ok=True)
for name, filename, start, duration, gain in cuts:
    subprocess.run([
        'ffmpeg', '-y', '-v', 'error', '-ss', str(start), '-i', str(source / filename),
        '-t', str(duration), '-af', f'volume={gain},afade=t=in:d=0.003,afade=t=out:st={duration-.004}:d=0.004',
        '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', str(output / f'{name}.wav'),
    ], check=True, timeout=20)
print('Prepared six short cues. Source files preserved.')
