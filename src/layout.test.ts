import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertManifest, type Manifest } from './catalog.ts';
import { createLayout, viewDistance } from './layout.ts';

const manifest = JSON.parse(readFileSync(new URL('../public/models/fusca-manifest.json', import.meta.url), 'utf8')) as Manifest;

test('every catalog piece has finite geometry and a unique identity', () => {
  assertManifest(manifest);
  assert.ok(manifest.objects.length > 100);
  assert.throws(() => assertManifest({ objects: [manifest.objects[0], manifest.objects[0]] }));
});

test('license plates retain their intended scale and vertical orientation', () => {
  const plates = manifest.objects.filter(piece => piece.label.startsWith('Placa cenográfica'));
  assert.equal(plates.length, 2);
  for (const plate of plates) {
    const size = plate.max.map((value, index) => value - plate.min[index]);
    assert.ok(Math.abs(size[0] - .316) < .001, 'Plate width must be 316 mm');
    assert.ok(Math.abs(size[1] - .104) < .001, 'Plate height must be 104 mm');
    assert.ok(size[2] < .001, 'Plate must stand vertically across the car');
  }
});

test('full disassembly assigns every piece a distinct non-overlapping slot', () => {
  const layout = createLayout(manifest.objects);
  assert.equal(layout.slots.length, manifest.objects.length);
  for (let i = 0; i < layout.slots.length; i++) {
    const a = layout.slots[i];
    assert.ok(a.offset.every(Number.isFinite));
    for (let j = i + 1; j < layout.slots.length; j++) {
      const b = layout.slots[j];
      const overlap = a.x < b.x + b.width - 1e-8 && a.x + a.width > b.x + 1e-8
        && a.y < b.y + b.height - 1e-8 && a.y + a.height > b.y + 1e-8;
      assert.equal(overlap, false, `${a.id} overlaps ${b.id}`);
    }
  }
});

test('camera covers the complete layout on desktop, portrait and landscape', () => {
  const { width, height } = createLayout(manifest.objects);
  for (const aspect of [16 / 9, 390 / 560, 844 / 290]) {
    const d = viewDistance(width, height, aspect);
    const availableHeight = 2 * (d - 2) * Math.tan(36 * Math.PI / 360);
    assert.ok(availableHeight >= height);
    assert.ok(availableHeight * aspect >= width);
  }
});
