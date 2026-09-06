import { test } from 'node:test';
import assert from 'node:assert/strict';
import { engineMotion } from './engine-motion.ts';

test('engine movement stays millimetric and stops completely when disabled', () => {
  for (let frame = 0; frame < 300; frame++) {
    const seconds = frame / 30;
    const motion = engineMotion(seconds, true);
    assert.ok(Math.hypot(motion.x, motion.y, motion.z) < .003);
    assert.ok(Math.abs(motion.pitch) < .001 && Math.abs(motion.roll) < .001);
    assert.ok(Object.values(engineMotion(seconds, false)).every(value => value === 0));
    assert.ok(Object.values(engineMotion(seconds, true, 0)).every(value => value === 0));
  }
  assert.notDeepEqual(engineMotion(.1, true), engineMotion(.2, true));
});
