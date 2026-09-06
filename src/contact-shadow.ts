import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

// Cached height-based contact shadow: one small depth pass and two blur passes
// only when the arrangement changes, independent of orbit and engine vibration.
export function createContactShadow(renderer: THREE.WebGLRenderer, scene: THREE.Scene, model: THREE.Group) {
  const resolution = 512;
  const target = new THREE.WebGLRenderTarget(resolution, resolution);
  const intermediate = new THREE.WebGLRenderTarget(resolution, resolution, { depthBuffer: false });
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.BasicDepthPacking, side: THREE.DoubleSide });
  depth.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace(
      'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
      'gl_FragColor = vec4( vec3( 0.12, 0.10, 0.07 ), pow( 1.0 - fragCoordZ, 3.0 ) );',
    );
  };
  const horizontal = new THREE.ShaderMaterial({ ...HorizontalBlurShader, uniforms: THREE.UniformsUtils.clone(HorizontalBlurShader.uniforms), depthTest: false, depthWrite: false });
  const vertical = new THREE.ShaderMaterial({ ...VerticalBlurShader, uniforms: THREE.UniformsUtils.clone(VerticalBlurShader.uniforms), depthTest: false, depthWrite: false });
  horizontal.uniforms.h.value = 1 / resolution;
  vertical.uniforms.v.value = 1 / resolution;
  const quad = new FullScreenQuad(horizontal);
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, .001, 1.3);
  camera.position.set(0, -.0005, 0); camera.up.set(0, 0, 1); camera.lookAt(0, 1, 0);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: target.texture, transparent: true, opacity: .82, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  mesh.rotation.x = Math.PI / 2; mesh.position.y = -.0005; mesh.renderOrder = 1;
  scene.add(mesh);

  return {
    mesh,
    capture() {
      const visibility = scene.children.map(child => child.visible);
      const background = scene.background, override = scene.overrideMaterial;
      const savedTarget = renderer.getRenderTarget(), clearAlpha = renderer.getClearAlpha();
      const clearColor = renderer.getClearColor(new THREE.Color());
      const shadows = renderer.shadowMap.enabled;
      const position = model.position.clone(), rotation = model.rotation.clone();
      try {
        scene.children.forEach(child => { child.visible = child === model; });
        scene.background = null; scene.overrideMaterial = depth;
        renderer.shadowMap.enabled = false;
        model.position.set(0, 0, 0); model.rotation.set(0, 0, 0);
        renderer.setClearColor(0x000000, 0);
        renderer.setRenderTarget(target); renderer.clear(); renderer.render(scene, camera);
        quad.material = horizontal; horizontal.uniforms.tDiffuse.value = target.texture;
        renderer.setRenderTarget(intermediate); renderer.clear(); quad.render(renderer);
        quad.material = vertical; vertical.uniforms.tDiffuse.value = intermediate.texture;
        renderer.setRenderTarget(target); renderer.clear(); quad.render(renderer);
      } finally {
        scene.children.forEach((child, i) => { child.visible = visibility[i]; });
        scene.background = background; scene.overrideMaterial = override;
        model.position.copy(position); model.rotation.copy(rotation);
        renderer.shadowMap.enabled = shadows;
        renderer.setRenderTarget(savedTarget); renderer.setClearColor(clearColor, clearAlpha);
      }
    },
    dispose() {
      scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose();
      depth.dispose(); horizontal.dispose(); vertical.dispose(); quad.dispose();
      target.dispose(); intermediate.dispose();
    },
  };
}
