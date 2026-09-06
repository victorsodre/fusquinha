import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HAZARD_CYCLE, WIPER_CYCLE } from './vehicle-sounds.ts';

test('the animation periods match the real WAV loop durations', () => {
  for (const [name, expected] of [['hazards', HAZARD_CYCLE], ['wipers', WIPER_CYCLE]] as const) {
    const wav = readFileSync(new URL(`../public/audio/sfx/${name}.wav`, import.meta.url));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    let bytesPerSecond = 0, dataBytes = 0;
    for (let offset = 12; offset + 8 <= wav.length;) {
      const id = wav.toString('ascii', offset, offset + 4), size = wav.readUInt32LE(offset + 4);
      if (id === 'fmt ') bytesPerSecond = wav.readUInt32LE(offset + 16);
      if (id === 'data') dataBytes = size;
      offset += 8 + size + size % 2;
    }
    assert.ok(bytesPerSecond > 0 && dataBytes > 0);
    assert.equal(dataBytes / bytesPerSecond, expected, `${name} must stay in sync without accumulated drift`);
  }
});
