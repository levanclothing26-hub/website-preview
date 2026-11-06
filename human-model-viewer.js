import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export async function createHumanModelViewer({ canvas, assetUrl, onProgress = () => {} }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.01, 100);
  const key = new THREE.DirectionalLight(0xfff2df, 3.4);
  key.position.set(-3.5, 6, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -1;
  key.shadow.bias = -0.0002;
  scene.add(key, new THREE.HemisphereLight(0xe7f0ff, 0x746957, 2.1));

  const fill = new THREE.DirectionalLight(0xdce7ff, 1.6);
  fill.position.set(4, 2.5, -4);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ color: 0x252c34, opacity: 0.16 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await new Promise((resolve, reject) => {
    loader.load(assetUrl, resolve, undefined, reject);
  });
  const model = gltf.scene;
  let surfaceCount = 0;
  let materialCount = 0;
  let texturedMaterialCount = 0;
  model.traverse((node) => {
    if (!node.isMesh) return;
    surfaceCount += 1;
    node.castShadow = true;
    node.receiveShadow = true;
    for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
      if (!material) continue;
      materialCount += 1;
      if (material.map) texturedMaterialCount += 1;
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      material.needsUpdate = true;
    }
  });
  if (!surfaceCount) throw new Error('The human-worn GLB contains no renderable meshes.');
  if (!materialCount || !texturedMaterialCount) throw new Error('The human-worn GLB is missing textured PBR materials.');

  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('The human-worn GLB has invalid dimensions.');
  model.position.set(-center.x, -bounds.min.y, -center.z);
  modelRoot.add(model);

  const fitSize = Math.max(size.y, size.x * 1.3, size.z * 1.4);
  camera.position.set(0, size.y * 0.49, fitSize * 2.6);
  camera.lookAt(0, size.y * 0.49, 0);

  const clock = new THREE.Clock();
  let targetRotation = 0;
  let isPlaying = false;
  let animationFrame = 0;

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  function render() {
    const delta = Math.min(clock.getDelta(), 0.05);
    if (isPlaying) targetRotation += delta * 0.42;
    modelRoot.rotation.y += (targetRotation - modelRoot.rotation.y) * Math.min(1, delta * 8);
    renderer.render(scene, camera);
    onProgress(((targetRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2));
    animationFrame = requestAnimationFrame(render);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  render();

  return {
    setProgress(progress) { targetRotation = THREE.MathUtils.clamp(progress, 0, 1) * Math.PI * 2; },
    drag(deltaX, width) { targetRotation += (deltaX / Math.max(width, 1)) * Math.PI * 2; },
    setPlaying(value) { isPlaying = value; },
    dispose() {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.dispose();
    },
  };
}
