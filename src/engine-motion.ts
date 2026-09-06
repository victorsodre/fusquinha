// Millimetric displacement, in model meters. No camera movement.
export function engineMotion(seconds: number, enabled: boolean, strength = 1) {
  const amount = enabled ? Math.max(0, Math.min(1, strength)) : 0;
  return {
    x: Math.sin(seconds * Math.PI * 2 * 8.3) * .0012 * amount,
    y: (Math.sin(seconds * Math.PI * 2 * 10.7) * .0018 + Math.sin(seconds * 19) * .0006) * amount,
    z: Math.sin(seconds * Math.PI * 2 * 7.1 + .8) * .0008 * amount,
    pitch: Math.sin(seconds * 47) * .0006 * amount,
    roll: Math.sin(seconds * 59 + .4) * .0008 * amount,
  };
}
