import * as THREE from 'three';

// A quiet, worn stone floor. The alpha falloff blends into the page's courtyard.
export function createGarageFloor(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d')!;
  let seed = 1965;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  context.fillStyle = '#c6c3aa'; context.fillRect(0, 0, 1024, 1024);
  for (let row = 0; row < 12; row++) for (let col = -1; col < 12; col++) {
    const x = col * 96 + (row % 2) * 48, y = row * 96;
    const lightness = 81 + random() * 4;
    context.fillStyle = `hsl(46 30% ${lightness}%)`;
    context.fillRect(x + 1.2, y + 1.2, 93.6, 93.6);
    context.strokeStyle = 'rgba(255,253,233,.24)'; context.lineWidth = .8;
    context.strokeRect(x + 2.5, y + 2.5, 90.5, 90.5);
  }
  for (let i = 0; i < 22000; i++) {
    context.fillStyle = random() > .5 ? 'rgba(83,79,58,.035)' : 'rgba(255,251,226,.055)';
    context.fillRect(random() * 1024, random() * 1024, 1 + random(), 1 + random());
  }
  const fade = context.createRadialGradient(512, 512, 100, 512, 512, 512);
  fade.addColorStop(0, '#fff'); fade.addColorStop(.56, 'rgba(255,255,255,.92)');
  fade.addColorStop(.8, 'rgba(255,255,255,.45)'); fade.addColorStop(1, 'rgba(255,255,255,0)');
  context.globalCompositeOperation = 'destination-in'; context.fillStyle = fade; context.fillRect(0, 0, 1024, 1024);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const material = new THREE.MeshStandardMaterial({ map: texture, color: '#fff5d9', transparent: true, roughness: .97, metalness: 0, envMapIntensity: 1.55, depthWrite: false });
  // Fade only the floor at viewport edges, keeping the car and labels intact.
  const viewport = { value: new THREE.Vector2() };
  material.onBeforeCompile = shader => {
    shader.uniforms.garageViewport = viewport;
    shader.fragmentShader = `uniform vec2 garageViewport;\n${shader.fragmentShader}`.replace(
      '#include <alphatest_fragment>',
      `vec2 garageScreen = gl_FragCoord.xy / garageViewport;
       diffuseColor.a *= smoothstep(0.0, 0.08, garageScreen.x)
         * smoothstep(0.0, 0.08, 1.0 - garageScreen.x)
         * smoothstep(0.0, 0.12, garageScreen.y);
       #include <alphatest_fragment>`,
    );
  };
  material.customProgramCacheKey = () => 'garage-floor-edge-fade';
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), material);
  ground.onBeforeRender = () => { renderer.getDrawingBufferSize(viewport.value); };
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.003; ground.receiveShadow = true;
  const floor = new THREE.Group(); floor.name = 'Piso da garagem'; floor.add(ground);
  return floor;
}
