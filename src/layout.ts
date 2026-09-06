import { Vector3 } from 'three';
import type { Piece, Vector } from './catalog.ts';

export const viewDirection = new Vector3(5.7, 3.4, 6.6).normalize();
const right = new Vector3().crossVectors(new Vector3(0, 1, 0), viewDirection).normalize();
const up = new Vector3().crossVectors(viewDirection, right).normalize();
export const boardCenter = new Vector3(0, 3, 0);
export interface Slot { id: string; x: number; y: number; width: number; height: number; offset: Vector; }

/** Shelf packing in the camera plane. Real projected bounds keep large panels apart. */
export function createLayout(pieces: Piece[]) {
  const padding = .12;
  const boxes = pieces.map(p => {
    const size = p.max.map((v, i) => v - p.min[i]);
    const projected = (axis: Vector3) => size[0] * Math.abs(axis.x) + size[1] * Math.abs(axis.y) + size[2] * Math.abs(axis.z);
    return { p, width: Math.max(.18, projected(right) * 1.3) + padding, height: Math.max(.18, projected(up) * 1.3) + padding };
  }).sort((a, b) => b.height - a.height || a.p.id.localeCompare(b.p.id));
  const area = boxes.reduce((sum, b) => sum + b.width * b.height, 0);
  const targetWidth = Math.max(8, Math.sqrt(area * 1.7), ...boxes.map(b => b.width));
  let x = 0, y = 0, rowHeight = 0, width = 0;
  const slots: Slot[] = [];
  for (const b of boxes) {
    if (x > 0 && x + b.width > targetWidth) { y += rowHeight; x = 0; rowHeight = 0; }
    slots.push({ id: b.p.id, x, y, width: b.width, height: b.height, offset: [0, 0, 0] });
    x += b.width;
    width = Math.max(width, x);
    rowHeight = Math.max(rowHeight, b.height);
  }
  const height = y + rowHeight;
  const lookup = new Map(pieces.map(p => [p.id, p]));
  for (const s of slots) {
    const center = boardCenter.clone()
      .addScaledVector(right, s.x + s.width / 2 - width / 2)
      .addScaledVector(up, height / 2 - s.y - s.height / 2);
    s.offset = center.sub(new Vector3(...lookup.get(s.id)!.center)).toArray() as Vector;
  }
  return { slots, width, height };
}

export function assemblyOffset(piece: Piece): Vector3 {
  const [x, , z] = piece.center;
  const side = x < 0 ? -1 : 1;
  switch (piece.group) {
    case 'body': return new Vector3(x * .7, 1.4, z * .45);
    case 'doors': return new Vector3(side * 1.25, .5, z * .2);
    case 'glass': return new Vector3(x * 1.1, 2.3, z * .4);
    case 'interior': return new Vector3(x * .6, .8, z * .35);
    case 'engine': return new Vector3(x * .5, .15, -1.5);
    case 'mechanical': return new Vector3(x * .6, -.05, z * .55);
    case 'wheels': return new Vector3(side * 1.2, 0, z * .5);
    case 'chassis': return new Vector3(0, -.15, 0);
    case 'trim': return new Vector3(x * 1.3, .5, z * .85);
  }
}

export function viewDistance(width: number, height: number, aspect: number, fov = 36) {
  const tangent = Math.tan(fov * Math.PI / 360);
  return Math.max(height / (2 * tangent), width / (2 * tangent * Math.max(.2, aspect))) * 1.2 + 2;
}
