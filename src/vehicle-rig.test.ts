import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { driverDoorIds, wiperSets, headlightIds, frontIndicatorIds, rearIndicatorIds, doorPivot, maxDoorAngle, rotateAboutHinge } from './vehicle-rig.ts';
import type { Manifest } from './catalog.ts';

const manifest = JSON.parse(readFileSync(new URL('../public/models/fusca-manifest.json', import.meta.url), 'utf8')) as Manifest;
const byId = new Map(manifest.objects.map(piece => [piece.id, piece]));

test('every moving and illuminated component exists and has one control assignment', () => {
  const all = [...driverDoorIds, ...wiperSets.flatMap(set => set.ids), ...headlightIds, ...frontIndicatorIds, ...rearIndicatorIds];
  assert.equal(new Set(all).size, all.length);
  for (const id of all) assert.ok(byId.has(id), `Missing rig component: ${id}`);
  assert.ok(driverDoorIds.includes(manifest.objects.find(piece => piece.label === 'Porta esquerda')!.id));
  assert.ok(driverDoorIds.includes(manifest.objects.find(piece => piece.label === 'Vidro lateral esquerdo 02')!.id));
  for (const id of driverDoorIds) assert.ok(byId.get(id)!.center[0] < 0, 'Only driver-side components may open');
  for (const id of [...headlightIds, ...frontIndicatorIds]) assert.ok(byId.get(id)!.center[2] > 1.3);
  for (const id of rearIndicatorIds) assert.ok(byId.get(id)!.center[2] < -1.5);
});

test('the driver door opens outwards around its hinge and returns to its closed pose', () => {
  const closed = new Vector3(...byId.get('piece_005')!.center);
  const open = rotateAboutHinge(closed, doorPivot, maxDoorAngle);
  assert.ok(open.x < closed.x - .3);
  assert.ok(Math.abs(open.distanceTo(doorPivot) - closed.distanceTo(doorPivot)) < 1e-10);
  assert.ok(rotateAboutHinge(open, doorPivot, -maxDoorAngle).distanceTo(closed) < 1e-10);
  assert.ok(rotateAboutHinge(closed, doorPivot, 0).distanceTo(closed) < 1e-10);
});
