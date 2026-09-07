import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { assemblyOffset, boardCenter, createLayout, viewDirection, viewDistance } from './layout';
import { type GroupId, type Manifest, type Piece } from './catalog';
import { localGroups, localPiece, translate, type Locale } from './i18n';
import { engineMotion } from './engine-motion';
import { createContactShadow } from './contact-shadow';
import { plateLocation } from './project';
import { createVehicleRig, type VehicleSwitches } from './vehicle-rig';
import type { LoopSound } from './vehicle-sounds';
import { createGarageFloor } from './garage-floor';

export interface SceneHandle { reset: () => void; zoom: (factor: number) => void; capture: () => void; }
interface Props {
  manifest: Manifest;
  locale: Locale;
  selected: GroupId | null;
  focused: string;
  explosion: number;
  isolated: boolean;
  autoRotate: boolean;
  labels: boolean;
  wireframe: boolean;
  engineOn: boolean;
  vehicleSwitches: VehicleSwitches;
  audioClock: (name: LoopSound) => number | null;
  onSelect: (group: GroupId, id: string) => void;
  onReady: () => void;
}
interface VisualPiece {
  data: Piece; node: THREE.Object3D; home: THREE.Vector3;
  homeQuaternion: THREE.Quaternion;
  burst: THREE.Vector3; offset: THREE.Vector3; materials: THREE.MeshStandardMaterial[];
}

const VehicleScene = forwardRef<SceneHandle, Props>(function VehicleScene(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  current.current = props;
  const actions = useRef<SceneHandle & { update: () => void } | null>(null);
  const [status, setStatus] = useState(() => translate(props.locale, 'Preparing the yellow Beetle…', 'Preparando o amarelinho…'));
  const [error, setError] = useState('');
  useImperativeHandle(ref, () => ({
    reset: () => actions.current?.reset(),
    zoom: f => actions.current?.zoom(f),
    capture: () => actions.current?.capture(),
  }), []);

  useEffect(() => { actions.current?.update(); }, [props.selected, props.focused, props.explosion, props.isolated, props.autoRotate, props.labels, props.wireframe, props.engineOn, props.vehicleSwitches, props.locale]);

  useEffect(() => {
    const container = host.current!;
    let disposed = false, loaded = false, raf = 0, lastFrame = 0, time = 0, transition = 0;
    let progress = 0, targetProgress = 0, cameraMoving = false, hoverId = '', frames = 0;
    let lastHover = 0, lastShadow = 0, stateKey = '', viewWidth = 1, viewHeight = 1, resizeUntil = 0;
    let contactState = '', lastContactShadow = 0, contactCaptures = 0;
    let vehicleRig: ReturnType<typeof createVehicleRig> | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' }); }
    catch { setError(translate(props.locale, 'The 3D view requires WebGL. Try another browser.', 'A visualização 3D precisa de WebGL. Tente abrir em outro navegador.')); return; }

    renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .96;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-label', translate(props.locale, 'Beetle in 3D. Drag to turn and use the mouse wheel to zoom.', 'Fusca em 3D. Arraste para girar e use a roda do mouse para aproximar.'));
    renderer.domElement.setAttribute('role', 'img');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(36, 1, .015, 250);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = .085;
    controls.minDistance = .12;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI * .495;
    controls.minPolarAngle = .05;
    controls.autoRotateSpeed = .55;
    controls.enablePan = true;
    const desiredPosition = new THREE.Vector3(), desiredTarget = new THREE.Vector3();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    let studioEnvironment: THREE.WebGLRenderTarget | null = null;
    renderer.domElement.dataset.lighting = 'loading';
    new RGBELoader().load(`${import.meta.env.BASE_URL}lighting/studio_small_09_2k.hdr`, texture => {
      if (disposed) { texture.dispose(); return; }
      studioEnvironment = pmrem.fromEquirectangular(texture);
      scene.environment = studioEnvironment.texture;
      texture.dispose();
      renderer.domElement.dataset.lighting = 'studio';
      invalidate();
    }, undefined, () => { if (!disposed) renderer.domElement.dataset.lighting = 'fallback'; });
    scene.add(new THREE.HemisphereLight(0xf7f5ed, 0x777261, .32));
    const key = new THREE.DirectionalLight(0xfff4e8, .75);
    key.position.set(-3, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(matchMedia('(pointer: coarse)').matches ? 1024 : 2048, matchMedia('(pointer: coarse)').matches ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: .1, far: 20 });
    key.shadow.bias = -.00015; key.shadow.normalBias = .008;
    key.shadow.radius = 8;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdce7ff, .3); fill.position.set(4, 2.5, -4); scene.add(fill);

    const platform = createGarageFloor(renderer); scene.add(platform);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#716b50', opacity: .12 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.005; floor.receiveShadow = true; scene.add(floor);

    const model = new THREE.Group(); scene.add(model);
    const contactShadow = createContactShadow(renderer, scene, model);
    const plateTexture = createPlateTexture();
    plateTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const replacedPlateMaps = new Set<THREE.Texture>();
    const pieces: VisualPiece[] = [];
    const layout = createLayout(props.manifest.objects);
    const slots = new Map(layout.slots.map(s => [s.id, s]));
    const objectMap = new Map<string, VisualPiece>();
    const projection = new THREE.Vector3();
    const labels = localGroups(props.locale).map(group => {
      const button = document.createElement('button');
      button.className = 'scene-label'; button.textContent = group.name; button.hidden = true;
      button.addEventListener('click', () => current.current.onSelect(group.id, ''));
      container.appendChild(button);
      return { group: group.id, button };
    });

    function invalidate() {
      if (!disposed && !raf && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function fit(immediate = false) {
      const p = current.current;
      const direction = p.vehicleSwitches.doorOpen ? new THREE.Vector3(-5.7, 3.4, 6.6).normalize() : viewDirection;
      if (p.isolated && p.selected && pieces.length) {
        const box = new THREE.Box3();
        for (const part of pieces) {
          if (p.focused ? part.data.id === p.focused : part.data.group === p.selected) {
            box.union(new THREE.Box3(new THREE.Vector3(...part.data.min), new THREE.Vector3(...part.data.max)));
          }
        }
        if (box.isEmpty()) return;
        box.getCenter(desiredTarget);
        const radius = Math.max(.035, box.getSize(new THREE.Vector3()).length() / 2);
        const halfAngle = Math.atan(Math.tan(camera.fov * Math.PI / 360) * Math.min(1, camera.aspect));
        const distance = radius / Math.sin(halfAngle) * 1.2;
        desiredPosition.copy(desiredTarget).addScaledVector(direction, distance);
      } else {
        const first = Math.min(p.explosion / 45, 1);
        const spread = THREE.MathUtils.smoothstep(p.explosion, 45, 100);
        desiredTarget.set(0, .55 + first * .85, 0).lerp(boardCenter, spread);
        const assembled = viewDistance(4.4, 2.5, camera.aspect) - 1.5;
        const grouped = viewDistance(7.3, 4.4, camera.aspect) - 1.5;
        const all = viewDistance(layout.width, layout.height, camera.aspect);
        const distance = THREE.MathUtils.lerp(THREE.MathUtils.lerp(assembled, grouped, first), all, spread);
        desiredPosition.copy(desiredTarget).addScaledVector(direction, distance);
      }
      cameraMoving = true;
      if (immediate || reduced.matches) {
        camera.position.copy(desiredPosition); controls.target.copy(desiredTarget); controls.update(); cameraMoving = false;
      }
      invalidate();
    }

    function apply() {
      const p = current.current;
      targetProgress = p.isolated ? 0 : p.explosion / 100;
      controls.autoRotate = p.autoRotate && !reduced.matches;
      const nextKey = `${p.isolated}:${p.selected}:${p.focused}:${p.explosion}:${p.vehicleSwitches.doorOpen}`;
      if (stateKey !== nextKey) { stateKey = nextKey; fit(); }
      for (const part of pieces) {
        const selected = p.focused ? p.focused === part.data.id : p.selected === part.data.group;
        part.node.visible = !p.isolated || selected;
        for (const m of part.materials) {
          m.wireframe = p.wireframe;
          m.emissive.set(selected && !p.isolated ? '#785c16' : part.data.id === hoverId ? '#7e6628' : '#000000');
          m.emissiveIntensity = selected ? .13 : .08;
          m.userData.baseEmissive = m.emissive.getHex(); m.userData.baseEmissiveIntensity = m.emissiveIntensity;
        }
      }
      transition = performance.now() + 1300;
      renderer.shadowMap.needsUpdate = true;
      invalidate();
    }

    const loader = new GLTFLoader();
    loader.load(`${import.meta.env.BASE_URL}models/fusca.glb`, gltf => {
      if (disposed) { disposeObject(gltf.scene); return; }
      gltf.scene.updateMatrixWorld(true);
      for (const data of props.manifest.objects) {
        const node = gltf.scene.getObjectByName(data.id);
        if (!node) { setError(translate(current.current.locale, `Geometry for ${localPiece(data, current.current.locale)} is missing.`, `A geometria de ${data.label} está ausente.`)); disposeObject(gltf.scene); return; }
        model.attach(node);
        const materials: THREE.MeshStandardMaterial[] = [];
        node.traverse(child => {
          if (!(child instanceof THREE.Mesh)) return;
          child.userData.pieceId = data.id;
          child.castShadow = data.group !== 'glass'; child.receiveShadow = true;
          const source = Array.isArray(child.material) ? child.material : [child.material];
          const clones = source.map(m => {
            const copy = m.clone() as THREE.MeshStandardMaterial;
            copy.envMapIntensity = .78;
            if (data.label.startsWith('Placa cenográfica')) {
              if (copy.map) replacedPlateMaps.add(copy.map);
              copy.map = plateTexture; copy.color.set('#ffffff');
              copy.roughness = .68; copy.metalness = .05;
            }
            if (copy.name === 'Pintura_Amarelo_Solar') {
              copy.metalness = .04; copy.roughness = .32;
              if (copy instanceof THREE.MeshPhysicalMaterial) { copy.clearcoat = 1; copy.clearcoatRoughness = .14; }
            }
            if (data.group === 'glass') { copy.transparent = true; copy.opacity = .28; copy.depthWrite = false; }
            materials.push(copy);
            return copy;
          });
          child.material = Array.isArray(child.material) ? clones : clones[0];
        });
        const visual = { data, node, home: node.position.clone(), homeQuaternion: node.quaternion.clone(), burst: assemblyOffset(data), offset: new THREE.Vector3(...slots.get(data.id)!.offset), materials };
        pieces.push(visual); objectMap.set(data.id, visual);
      }
      vehicleRig = createVehicleRig(scene, pieces);
      loaded = true; setStatus('');
      renderer.domElement.dataset.pieces = String(pieces.length);
      renderer.domElement.dataset.ready = 'true';
      apply(); fit(true); current.current.onReady();
    }, event => {
      if (!disposed && event.total) setStatus(translate(current.current.locale, `Preparing the yellow Beetle… ${Math.round(event.loaded / event.total * 100)}%`, `Preparando o amarelinho… ${Math.round(event.loaded / event.total * 100)}%`));
    }, () => {
      if (!disposed) setError(translate(current.current.locale, 'The Beetle could not load. Reload the page to try again.', 'Não foi possível carregar o Fusca. Recarregue a página para tentar novamente.'));
    });

    const resize = () => {
      const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
      if (width === viewWidth && height === viewHeight) return;
      viewWidth = width; viewHeight = height;
      // Keep drawing briefly while the browser reallocates/composites the canvas.
      resizeUntil = performance.now() + 250;
      renderer.domElement.dataset.settled = 'false';
      renderer.setSize(viewWidth, viewHeight); camera.aspect = viewWidth / viewHeight; camera.updateProjectionMatrix(); fit(true);
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    function pick(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pieces.filter(p => p.node.visible).map(p => p.node), true)[0];
      return hit ? objectMap.get(hit.object.userData.pieceId) : undefined;
    }
    const activePointers = new Set<number>();
    let tap: { id: number; x: number; y: number; time: number; moved: boolean } | null = null;
    const down = (e: PointerEvent) => {
      activePointers.add(e.pointerId); cameraMoving = false;
      tap = activePointers.size === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, time: performance.now(), moved: false } : null;
      invalidate();
    };
    const move = (e: PointerEvent) => {
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > (e.pointerType === 'touch' ? 10 : 5)) tap.moved = true;
      if (activePointers.size || e.pointerType === 'touch' || performance.now() - lastHover < 90 || !loaded) return;
      lastHover = performance.now();
      const id = pick(e)?.data.id || '';
      if (id !== hoverId) { hoverId = id; renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; apply(); }
    };
    const upEvent = (e: PointerEvent) => {
      const isTap = tap && tap.id === e.pointerId && !tap.moved && performance.now() - tap.time < 600 && activePointers.size === 1;
      activePointers.delete(e.pointerId); tap = null;
      if (isTap && loaded) {
        const part = pick(e);
        if (part) current.current.onSelect(part.data.group, part.data.id);
      }
      invalidate();
    };
    const cancel = (e: PointerEvent) => { activePointers.delete(e.pointerId); tap = null; };
    const leave = () => { if (hoverId) { hoverId = ''; apply(); } };
    const wheel = () => { cameraMoving = false; invalidate(); };
    const lost = (e: Event) => { e.preventDefault(); setError(translate(current.current.locale, 'The graphics connection was interrupted. Reload the page.', 'A conexão com a placa gráfica foi interrompida. Recarregue a página.')); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else invalidate(); };
    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', upEvent);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('wheel', wheel, { passive: true });
    canvas.addEventListener('webglcontextlost', lost);
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', apply);
    controls.addEventListener('change', invalidate);

    function frame(now: number) {
      raf = 0;
      if (disposed || document.hidden) return;
      if (now - lastFrame < 30) { invalidate(); return; }
      const dt = Math.min(.1, (now - lastFrame) / 1000 || .033); lastFrame = now;
      const p = current.current;
      const easing = reduced.matches ? 1 : 1 - Math.exp(-dt * 7);
      progress = THREE.MathUtils.lerp(progress, targetProgress, easing);
      if (Math.abs(progress - targetProgress) < .0001) progress = targetProgress;
      const first = THREE.MathUtils.smoothstep(progress, 0, .45);
      const all = THREE.MathUtils.smoothstep(progress, .45, 1);
      const vibrating = p.engineOn && !reduced.matches && all < 1;
      const motion = engineMotion(now / 1000, vibrating, 1 - all);
      model.position.set(motion.x, motion.y, motion.z);
      model.rotation.set(motion.pitch, 0, motion.roll);
      for (const part of pieces) {
        part.node.position.copy(part.home).addScaledVector(part.burst, first * (1 - all)).addScaledVector(part.offset, all);
        part.node.quaternion.copy(part.homeQuaternion);
      }
      const rigState = vehicleRig?.update(p.vehicleSwitches, dt, !p.isolated && progress === 0, reduced.matches, { hazards: p.audioClock('hazards'), wipers: p.audioClock('wipers') });
      platform.visible = !p.isolated && progress < .68;
      contactShadow.mesh.visible = !p.isolated && progress < .3;
      floor.visible = progress < .55 && !p.isolated;
      key.castShadow = progress < .55 && !p.isolated;
      const nextContactState = `${progress}:${rigState?.doorAngle.toFixed(3) ?? 0}`;
      if (loaded && contactShadow.mesh.visible && nextContactState !== contactState && now - lastContactShadow > 140) {
        contactShadow.capture(); contactState = nextContactState; lastContactShadow = now;
        canvas.dataset.contactShadows = String(++contactCaptures);
      }
      if (cameraMoving) {
        camera.position.lerp(desiredPosition, easing); controls.target.lerp(desiredTarget, easing);
        if (camera.position.distanceToSquared(desiredPosition) < .00001 && controls.target.distanceToSquared(desiredTarget) < .00001) cameraMoving = false;
      }
      const controlsMoved = controls.update();
      if (now - lastShadow > 140 && (now < transition || progress !== targetProgress || rigState?.transitioning)) { renderer.shadowMap.needsUpdate = true; lastShadow = now; }
      if (now - time > 80) {
        time = now;
        for (const item of labels) {
          const visible = p.labels && !p.isolated && progress < .65;
          item.button.hidden = !visible;
          if (!visible) continue;
          const relevant = pieces.filter(o => o.data.group === item.group && o.node.visible);
          if (!relevant.length) { item.button.hidden = true; continue; }
          projection.set(0, 0, 0);
          for (const part of relevant) projection.add(part.node.position);
          projection.divideScalar(relevant.length).project(camera);
          item.button.hidden = projection.z > 1 || Math.abs(projection.x) > .95 || Math.abs(projection.y) > .95;
          item.button.style.left = `${(projection.x * .5 + .5) * viewWidth}px`;
          item.button.style.top = `${(-projection.y * .5 + .5) * viewHeight}px`;
        }
      }
      canvas.dataset.explosion = progress.toFixed(3);
      canvas.dataset.visiblePieces = String(pieces.filter(o => o.node.visible).length);
      canvas.dataset.cameraDistance = camera.position.distanceTo(controls.target).toFixed(4);
      canvas.dataset.frames = String(++frames);
      canvas.dataset.autoRotate = String(controls.autoRotate);
      canvas.dataset.engineVibrating = String(vibrating);
      canvas.dataset.engineMotion = `${motion.x},${motion.y},${motion.z}`;
      canvas.dataset.headlights = String(rigState?.headlightsOn ?? false);
      canvas.dataset.doorAngle = (rigState?.doorAngle ?? 0).toFixed(4);
      canvas.dataset.wiperAngle = (rigState?.wiperAngle ?? 0).toFixed(4);
      canvas.dataset.hazardPulse = String(rigState?.pulse ?? false);
      canvas.dataset.settled = String(progress === targetProgress && !cameraMoving && !rigState?.transitioning && now >= resizeUntil);
      renderer.render(scene, camera);
      if (vibrating || rigState?.animate || rigState?.transitioning || controlsMoved || cameraMoving || controls.autoRotate || progress !== targetProgress || now < transition || now < resizeUntil || (contactShadow.mesh.visible && contactState !== nextContactState)) invalidate();
    }

    actions.current = {
      update: apply,
      reset: () => fit(),
      zoom: factor => {
        cameraMoving = false;
        const distance = camera.position.distanceTo(controls.target);
        camera.position.sub(controls.target).multiplyScalar(THREE.MathUtils.clamp(distance * factor, controls.minDistance, controls.maxDistance) / distance).add(controls.target);
        controls.update(); invalidate();
      },
      capture: () => {
        renderer.render(scene, camera);
        const picture = document.createElement('canvas'); picture.width = canvas.width; picture.height = canvas.height;
        const context = picture.getContext('2d')!;
        context.fillStyle = '#ecebdc'; context.fillRect(0, 0, picture.width, picture.height); context.drawImage(canvas, 0, 0);
        picture.toBlob(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'fusquinha-amarelinho.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
      },
    };
    return () => {
      disposed = true; actions.current = null; cancelAnimationFrame(raf); observer.disconnect(); controls.dispose();
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', apply);
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', upEvent); canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('webglcontextlost', lost);
      labels.forEach(l => l.button.remove()); vehicleRig?.dispose(); contactShadow.dispose(); disposeObject(scene); plateTexture.dispose(); replacedPlateMaps.forEach(texture => texture.dispose()); room.dispose(); environment.dispose(); studioEnvironment?.dispose(); pmrem.dispose(); renderer.dispose(); canvas.remove();
    };
  }, [props.manifest]);

  return <div className="scene">
    <div className="scene-canvas" ref={host} />
    {Boolean(status || error) && <div className={`scene-status ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>
      {!error && <span className="loading-wheel" />}<p>{error || status}</p>
      {error && <button onClick={() => window.location.reload()}>{translate(props.locale, 'Try again', 'Tentar novamente')}</button>}
    </div>}
  </div>;
});

function createPlateTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 320;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#e7e5da'; context.fillRect(0, 0, 960, 320);
  context.strokeStyle = '#77796b'; context.lineWidth = 8; context.strokeRect(13, 13, 934, 294);
  context.fillStyle = '#363d33'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.font = '600 43px Arial'; context.fillText(plateLocation, 480, 64);
  context.font = '700 164px monospace'; context.fillText('FUS-1965', 480, 195);
  for (const x of [40, 920]) { context.beginPath(); context.arc(x, 40, 7, 0, Math.PI * 2); context.fill(); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; texture.name = plateLocation;
  return texture;
}

function disposeObject(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>(); const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
  });
  for (const material of materials) {
    Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); }); material.dispose();
  }
  textures.forEach(t => t.dispose());
}

export default VehicleScene;
