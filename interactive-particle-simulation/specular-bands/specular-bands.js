import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

let renderer, scene, camera;
let mesh;

init();

function init() {
  renderer = new THREE.WebGLRenderer({ alpha: true }); // Set alpha to true
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 1.5);

  new OrbitControls(camera, renderer.domElement);

  // Sky
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 32;

  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, 32);
  //   gradient.addColorStop(0.0, "#014a84");
  //   gradient.addColorStop(0.5, "#0561a0");
  //   gradient.addColorStop(1.0, "#437ab6");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1, 32);

  const skyMap = new THREE.CanvasTexture(canvas);
  skyMap.colorSpace = THREE.SRGBColorSpace;

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(10),
    new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide })
  );
  //scene.add(sky);

  // Texture
  const size = 128;
  const data = new Uint8Array(size * size * size);

  let i = 0;
  const scale = 0.05;
  const perlin = new ImprovedNoise();
  const vector = new THREE.Vector3();

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d =
          1.0 -
          vector
            .set(x, y, z)
            .subScalar(size / 2)
            .divideScalar(size)
            .length();
        data[i] =
          (128 +
            128 *
              perlin.noise((x * scale) / 1.5, y * scale, (z * scale) / 1.5)) *
          d *
          d;
        i++;
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  // Material
  const vertexShader = /* glsl */ `
		in vec3 position;

		uniform mat4 modelMatrix;
		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;
		uniform vec3 cameraPos;

		out vec3 vOrigin;
		out vec3 vDirection;

		void main() {
			vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

			vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPos, 1.0)).xyz;
			vDirection = position - vOrigin;

			gl_Position = projectionMatrix * mvPosition;
		}
	`;

  const fragmentShader = /* glsl */ `
  precision highp float;
  precision highp sampler3D;

  uniform vec3 base;
  uniform sampler3D map;

  uniform float threshold;
  uniform float range;
  uniform float opacity;
  uniform float steps;
  uniform float frame;
  uniform vec2 iResolution;
  uniform float iTime;

  in vec3 vOrigin;
  in vec3 vDirection;

  out vec4 color;

  void main() {
      // Normalize pixel coordinates (from 0 to 1)
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      
      // Convert UV to Shadertoy-style coordinates
      vec2 v = uv * 2.0 - 1.0;
      v.x *= iResolution.x / iResolution.y; // Aspect ratio correction
      
      // Initialize output color
      vec4 o = vec4(0.0);
      
      // Custom Shadertoy effect (adjusted for Three.js)
      vec2 u = (v + v - (o.xy = iResolution.xy)) / o.y;
      u /= 0.5 + 0.2 * dot(u, u);
      u += 0.2 * cos(iTime) - 7.56;

      for (int i = 0; i < 3; i++) {
          o[i] = 1.0 - exp(-6.0 / exp(6.0 * length(v + sin(5.0 * v.y - 3.0 * iTime) / 4.0)));
          v = sin(1.5 * u.yx + 2.0 * cos(u -= 0.01));
      }

      // Apply opacity and finalize color
      color = vec4(o.rgb, opacity);
  }
`;

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      base: { value: new THREE.Color(0x798aa0) },
      map: { value: texture },
      cameraPos: { value: new THREE.Vector3() },
      threshold: { value: 0.25 },
      opacity: { value: 0.25 },
      range: { value: 0.1 },
      steps: { value: 100 },
      frame: { value: 0 },
      iResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      iTime: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    transparent: true,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const parameters = {
    threshold: 0.25,
    opacity: 0.25,
    range: 0.1,
    steps: 100,
  };

  function update() {
    material.uniforms.threshold.value = parameters.threshold;
    material.uniforms.opacity.value = parameters.opacity;
    material.uniforms.range.value = parameters.range;
    material.uniforms.steps.value = parameters.steps;
  }

  const gui = new GUI();
  gui.add(parameters, "threshold", 0, 1, 0.01).onChange(update);
  gui.add(parameters, "opacity", 0, 1, 0.01).onChange(update);
  gui.add(parameters, "range", 0, 1, 0.01).onChange(update);
  gui.add(parameters, "steps", 0, 200, 1).onChange(update);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  mesh.material.uniforms.cameraPos.value.copy(camera.position);
  mesh.rotation.y = -performance.now() / 7500;
  mesh.material.uniforms.frame.value++;

  // Update time and resolution uniforms for shader
  mesh.material.uniforms.iTime.value = performance.now() / 1000;
  mesh.material.uniforms.iResolution.value.set(1920, 1080);

  renderer.render(scene, camera);
}
