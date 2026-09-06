import * as THREE from 'three';
import { HAZARD_CYCLE, WIPER_CYCLE, type LoopSound } from './vehicle-sounds.ts';

const ids = (numbers: number[]) => numbers.map(n => `piece_${String(n).padStart(3, '0')}`);
// Components verified against the bounds and geometry of this asset version.
export const driverDoorIds = ids([5, 12, 15, 16, 19, 20, 21, 60, 71, 72, 73, 81, 96, 97, 101, 102, 103, 106, 107, 108, 138, 139, 146, 359, 362, 365, 398, 399, 400, 401, 402, 403, 404, 405, 406, 451]);
export const wiperSets = [
  { ids: ids([160, 161, 162, 163, 164, 165]), pivot: [.213, 1.066, .699] },
  { ids: ids([169, 170, 171, 172, 173, 174]), pivot: [-.226, 1.066, .699] },
];
export const headlightIds = ids([368, 369]);
export const frontIndicatorIds = ids([375, 376]);
export const rearIndicatorIds = ids([377, 378]);
export const doorPivot = new THREE.Vector3(-.637, .85, .692);
const doorAxis = new THREE.Vector3(0, 1, 0);
const wiperAxis = new THREE.Vector3(0, .558, .83).normalize();
export const maxDoorAngle = 1.12;
export const maxWiperAngle = 1.16;

export interface VehicleSwitches { headlights: boolean; doorOpen: boolean; hazards: boolean; wipers: boolean; }
export interface RigPiece {
  data: { id: string }; node: THREE.Object3D; home: THREE.Vector3;
  homeQuaternion: THREE.Quaternion; materials: THREE.MeshStandardMaterial[];
}

export function rotateAboutHinge(position: THREE.Vector3, pivot: THREE.Vector3, angle: number) {
  return position.clone().sub(pivot).applyAxisAngle(doorAxis, angle).add(pivot);
}

export function createVehicleRig(scene: THREE.Scene, pieces: RigPiece[]) {
  const byId = new Map(pieces.map(piece => [piece.data.id, piece]));
  const pick = (names: string[]) => names.map(name => {
    const piece = byId.get(name);
    if (!piece) throw new Error(`Peça de animação ausente: ${name}`);
    return piece;
  });
  const door = pick(driverDoorIds);
  const wipers = wiperSets.map(set => ({ parts: pick(set.ids), pivot: new THREE.Vector3(...set.pivot) }));
  const headlights = pick(headlightIds), front = pick(frontIndicatorIds), rear = pick(rearIndicatorIds);
  const lamps = [...headlights, ...front, ...rear];
  const lighting = new THREE.Group(); scene.add(lighting);
  const glowTexture = createGlowTexture();
  const beams = headlights.map(part => {
    const beam = new THREE.SpotLight('#fff0bb', 0, 7, Math.PI / 6, .75, 2);
    beam.position.copy(part.home).add(new THREE.Vector3(0, 0, .06));
    beam.target.position.set(part.home.x, -.04, 4.2);
    lighting.add(beam, beam.target);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: '#fff0c1', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    glow.position.copy(beam.position); glow.scale.set(.29, .29, 1); lighting.add(glow);
    return { beam, glow };
  });
  let doorAngle = 0, wiperAngle = 0, wipeTime = 0, blinkTime = 0;
  let previousWipers = false, previousHazards = false;
  const quaternion = new THREE.Quaternion();
  function articulate(parts: RigPiece[], pivot: THREE.Vector3, axis: THREE.Vector3, angle: number) {
    quaternion.setFromAxisAngle(axis, angle);
    for (const part of parts) {
      part.node.position.sub(pivot).applyQuaternion(quaternion).add(pivot);
      part.node.quaternion.premultiply(quaternion);
    }
  }
  function emit(parts: RigPiece[], color: string, strength: number) {
    for (const part of parts) for (const material of part.materials) {
      if (strength) { material.emissive.set(color); material.emissiveIntensity = strength; }
      else { material.emissive.setHex(material.userData.baseEmissive ?? 0); material.emissiveIntensity = material.userData.baseEmissiveIntensity ?? 0; }
    }
  }
  return {
    update(switches: VehicleSwitches, dt: number, active: boolean, reduced: boolean, audioTime: Record<LoopSound, number | null>) {
      const doorTarget = active && switches.doorOpen ? maxDoorAngle : 0;
      doorAngle = THREE.MathUtils.lerp(doorAngle, doorTarget, reduced ? 1 : 1 - Math.exp(-dt * 7));
      if (Math.abs(doorAngle - doorTarget) < .0005) doorAngle = doorTarget;
      if (switches.wipers && !previousWipers) wipeTime = 0;
      if (switches.hazards && !previousHazards) blinkTime = 0;
      previousWipers = switches.wipers; previousHazards = switches.hazards;
      const wiping = active && switches.wipers;
      if (wiping) wipeTime = audioTime.wipers ?? wipeTime + dt;
      if (active && switches.hazards) blinkTime = audioTime.hazards ?? blinkTime + dt;
      const wiperTarget = wiping ? reduced ? -maxWiperAngle / 2 : -(1 - Math.cos(wipeTime * Math.PI * 2 / WIPER_CYCLE)) * maxWiperAngle / 2 : 0;
      wiperAngle = wiping || reduced ? wiperTarget : THREE.MathUtils.lerp(wiperAngle, 0, 1 - Math.exp(-dt * 12));
      if (Math.abs(wiperAngle) < .0005) wiperAngle = 0;
      // Exploded and isolated views always use the original catalog positions.
      if (!active) { doorAngle = 0; wiperAngle = 0; }
      if (doorAngle) articulate(door, doorPivot, doorAxis, doorAngle);
      if (wiperAngle) for (const wiper of wipers) articulate(wiper.parts, wiper.pivot, wiperAxis, wiperAngle);
      const headlightsOn = active && switches.headlights;
      const pulse = active && switches.hazards && (reduced || blinkTime % HAZARD_CYCLE < HAZARD_CYCLE / 2);
      lighting.visible = active;
      for (const { beam, glow } of beams) { beam.intensity = headlightsOn ? 22 : 0; glow.material.opacity = headlightsOn ? .65 : 0; }
      emit(headlights, '#fff0bc', headlightsOn ? 4 : 0);
      emit(front, '#ff8808', pulse ? 3.5 : 0);
      emit(rear, '#ff2705', pulse ? 3.5 : headlightsOn ? .55 : 0);
      return {
        doorAngle, wiperAngle, pulse, headlightsOn,
        transitioning: doorAngle !== doorTarget || (!wiping && wiperAngle !== 0),
        animate: active && !reduced && (wiping || switches.hazards),
      };
    },
    dispose() {
      scene.remove(lighting); glowTexture.dispose();
      for (const { glow, beam } of beams) { glow.material.dispose(); beam.dispose(); }
      for (const part of lamps) for (const material of part.materials) material.emissiveIntensity = 0;
    },
  };
}

function createGlowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,.7)'); gradient.addColorStop(.18, 'rgba(255,255,255,.25)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}
