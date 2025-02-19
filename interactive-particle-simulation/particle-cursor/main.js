/**
 *
 *
 * Built by Ricky Segura
 * for all creatives on Earth.
 *
 * This code falls under MIT License.
 * Download the MIT License here:
 * https://github.com/rickysegura/interactive-particle-simulation/blob/main/LICENSE
 *
 * Happy Hacking!
 *
 *
 */

// Import Three.js
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Global variables
let G = 2; // Gravitational constant (adjusted for visual effect)
let escapeVelocity = 0.25; // Threshold for escaping orbit
let maxDistance = 10;
let mouseInfluenceRadius = 1; // Mouse Influence Radius
const damping = 0.99;
const dt = 0.016;
let particleCount = 100000; // Initial particle count
let particleSize = 0.005; // Initial particle size

// Credits overlay
const overlay = document.createElement("div");
overlay.style.position = "absolute";
overlay.style.bottom = "20px";
overlay.style.left = "20px";
overlay.style.color = "skyblue";
overlay.style.fontFamily = "Arial, sans-serif";
overlay.style.fontSize = "14px";
overlay.style.textShadow = "1px 1px 2px black";
overlay.innerHTML =
  'Created by <a href="https://x.com/devrickysegura">@devrickysegura</a> with <i class="fa-solid fa-heart fa-beat-fade"></i> in California | Music Credits: INZO - Overthinker';
document.body.appendChild(overlay);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";

// Audio setup
let audioContext;
let audioBuffer;
let audioSource;
let gainNode;

function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Load the audio file
  fetch("./musicFile.mp3") // REPLACES MUSIC FILE PATH TO YOUR AUDIO
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .then((decodedAudio) => {
      audioBuffer = decodedAudio;
      playAudio();
    })
    .catch((error) => console.error("Error loading audio:", error));
}

function playAudio() {
  audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.loop = false;

  // Create a gain node for volume control
  gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.01, audioContext.currentTime); // Start at 1% volume

  audioSource.connect(gainNode);
  gainNode.connect(audioContext.destination);

  audioSource.start();
  console.log("Audio started");
}

// Button to start audio
const startButton = document.createElement("button");
startButton.innerHTML =
  'Start Experience <i class="fa-solid fa-music fa-bounce"></i>';
startButton.style.position = "absolute";
startButton.style.backgroundColor = "white";
startButton.style.color = "#333";
startButton.style.top = "20px";
startButton.style.left = "20px";
startButton.style.zIndex = "1000";
document.body.appendChild(startButton);

startButton.addEventListener("click", () => {
  initAudio();
  startButton.style.display = "none"; // Hide the button after clicking
});

// Controls container
const controlsContainer = document.createElement("div");
controlsContainer.style.position = "absolute";
controlsContainer.style.top = "40px";
controlsContainer.style.right = "20px";
controlsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
controlsContainer.style.padding = "10px";
controlsContainer.style.borderRadius = "5px";
document.body.appendChild(controlsContainer);

// Slider controls
function createSlider(label, min, max, value, step, onChange) {
  const container = document.createElement("div");
  container.style.marginBottom = "10px";

  const labelElement = document.createElement("label");
  labelElement.textContent = `${label}: `;
  labelElement.style.color = "white";
  container.appendChild(labelElement);

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.step = step;
  slider.style.width = "100%";
  slider.addEventListener("input", onChange);
  container.appendChild(slider);

  const valueDisplay = document.createElement("span");
  valueDisplay.textContent = value;
  valueDisplay.style.marginLeft = "5px";
  valueDisplay.style.color = "white";
  container.appendChild(valueDisplay);

  controlsContainer.appendChild(container);
  return { slider, valueDisplay };
}

const gControl = createSlider("Gravity", 0, 10, G, 0.1, (e) => {
  G = parseFloat(e.target.value);
  gControl.valueDisplay.textContent = G.toFixed(1);
});

const escapeVelocityControl = createSlider(
  "Escape Velocity",
  0,
  1,
  escapeVelocity,
  0.01,
  (e) => {
    escapeVelocity = parseFloat(e.target.value);
    escapeVelocityControl.valueDisplay.textContent = escapeVelocity.toFixed(2);
  }
);

const mouseInfluenceRadiusControl = createSlider(
  "Mouse Influence Radius",
  0.1,
  10,
  mouseInfluenceRadius,
  0.1,
  (e) => {
    mouseInfluenceRadius = parseFloat(e.target.value);
    mouseInfluenceRadiusControl.valueDisplay.textContent =
      mouseInfluenceRadius.toFixed(1);
  }
);

const particleSizeControl = createSlider(
  "Particle Size",
  0.0001,
  0.05,
  particleSize,
  0.001,
  (e) => {
    particleSize = parseFloat(e.target.value);
    particleMaterial.size = particleSize;
    particleSizeControl.valueDisplay.textContent = particleSize.toFixed(3);
  }
);

const particleCountControl = createSlider(
  "Particle Count",
  1000,
  200000,
  particleCount,
  1000,
  (e) => {
    particleCount = parseInt(e.target.value);
    particleCountControl.valueDisplay.textContent = particleCount;
    updateParticles();
  }
);

let particleCount2 = 50000; // Initial particle count for second system
let particleSize2 = 0.005; // Initial particle size for second system

const particleSizeControl2 = createSlider(
  "Particle Size 2",
  0.0001,
  0.05,
  particleSize2,
  0.001,
  (e) => {
    particleSize2 = parseFloat(e.target.value);
    particleMaterial2.size = particleSize2;
    particleSizeControl2.valueDisplay.textContent = particleSize2.toFixed(3);
  }
);

const particleCountControl2 = createSlider(
  "Particle Count 2",
  1000,
  200000,
  particleCount2,
  1000,
  (e) => {
    particleCount2 = parseInt(e.target.value);
    particleCountControl2.valueDisplay.textContent = particleCount2;
    updateParticles2();
  }
);

// Particle setup
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
  positions[i] = (Math.random() - 0.5) * 10;
  positions[i + 1] = (Math.random() - 0.5) * 10;
  positions[i + 2] = (Math.random() - 0.5) * 0.5; // Closer on the z-axis
  velocities[i] = (Math.random() - 0.5) * 0.1;
  velocities[i + 1] = (Math.random() - 0.5) * 0.1;
  velocities[i + 2] = (Math.random() - 0.5) * 0.005; // Smaller velocity on the z-axis

  // Set initial color to blue
  colors[i] = 0.1; // Blue
  colors[i + 1] = 0.1; // Blue
  colors[i + 2] = 0.8; // Blue
}

particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: particleSize, // Use particleSize variable
  blending: THREE.AdditiveBlending,
  transparent: true,
  sizeAttenuation: true,
  vertexColors: true,
  emissive: new THREE.Color(0xFFF7D9), // Warm light color for glow
  emissiveIntensity: 51.0, // Intensity of the glow
});

let particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

const particles2 = new THREE.BufferGeometry();
const positions2 = new Float32Array(particleCount2 * 3);
const colors2 = new Float32Array(particleCount2 * 3);
const velocities2 = new Float32Array(particleCount2 * 3);

for (let i = 0; i < particleCount2 * 3; i += 3) {
  positions2[i] = (Math.random() - 0.5) * 10;
  positions2[i + 1] = (Math.random() - 0.5) * 10;
  positions2[i + 2] = (Math.random() - 0.5) * 0.5; // Closer on the z-axis
  velocities2[i] = (Math.random() - 0.5) * 0.1;
  velocities2[i + 1] = (Math.random() - 0.5) * 0.1;
  velocities2[i + 2] = (Math.random() - 0.5) * 0.005; // Smaller velocity on the z-axis

  // Set initial color to dark orange
  colors2[i] = 0.8; // Dark orange
  colors2[i + 1] = 0.4; // Dark orange
  colors2[i + 2] = 0.0; // Dark orange
}

particles2.setAttribute("position", new THREE.BufferAttribute(positions2, 3));
particles2.setAttribute("color", new THREE.BufferAttribute(colors2, 3));

const particleMaterial2 = new THREE.PointsMaterial({
  size: particleSize2, // Use particleSize2 variable
  blending: THREE.AdditiveBlending,
  transparent: true,
  sizeAttenuation: true,
  vertexColors: true,
  emissive: new THREE.Color(0xFFF7D9), // Warm light color for glow
  emissiveIntensity: 51.0, // Intensity of the glow
});

let particleSystem2 = new THREE.Points(particles2, particleMaterial2);
scene.add(particleSystem2);

camera.position.z = 5; // Camera Z-Position

const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onTouchMove(event) {
  if (event.touches.length > 0) {
    mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
  }
}

window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("touchmove", onTouchMove, false);

const raycaster = new THREE.Raycaster();

function updateParticles() {
  // Remove existing particles
  scene.remove(particleSystem);

  // Create new particles
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 10;
    positions[i + 1] = (Math.random() - 0.5) * 10;
    positions[i + 2] = (Math.random() - 0.5) * 0.5; // Closer on the z-axis
    velocities[i] = (Math.random() - 0.5) * 0.1;
    velocities[i + 1] = (Math.random() - 0.5) * 0.1;
    velocities[i + 2] = (Math.random() - 0.5) * 0.005; // Smaller velocity on the z-axis

    // Set initial color to blue
    colors[i] = 0.1; // Blue
    colors[i + 1] = 0.1; // Blue
    colors[i + 2] = 0.8; // Blue
  }

  particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);
}

function updateParticles2() {
  // Remove existing particles
  scene.remove(particleSystem2);

  // Create new particles
  const positions2 = new Float32Array(particleCount2 * 3);
  const colors2 = new Float32Array(particleCount2 * 3);
  const velocities2 = new Float32Array(particleCount2 * 3);

  for (let i = 0; i < particleCount2 * 3; i += 3) {
    positions2[i] = (Math.random() - 0.5) * 10;
    positions2[i + 1] = (Math.random() - 0.5) * 10;
    positions2[i + 2] = (Math.random() - 0.5) * 0.5; // Closer on the z-axis
    velocities2[i] = (Math.random() - 0.5) * 0.1;
    velocities2[i + 1] = (Math.random() - 0.5) * 0.1;
    velocities2[i + 2] = (Math.random() - 0.5) * 0.005; // Smaller velocity on the z-axis

    // Set initial color to dark orange
    colors2[i] = 0.8; // Dark orange
    colors2[i + 1] = 0.4; // Dark orange
    colors2[i + 2] = 0.0; // Dark orange
  }

  particles2.setAttribute("position", new THREE.BufferAttribute(positions2, 3));
  particles2.setAttribute("color", new THREE.BufferAttribute(colors2, 3));

  particleSystem2 = new THREE.Points(particles2, particleMaterial2);
  scene.add(particleSystem2);
}

// Animation function
function animate() {
  requestAnimationFrame(animate);

  const positions = particles.attributes.position.array;
  const colors = particles.attributes.color.array;
  const positions2 = particles2.attributes.position.array;
  const colors2 = particles2.attributes.color.array;

  raycaster.setFromCamera(mouse, camera);
  const mouseIntersectPoint = new THREE.Vector3();
  raycaster.ray.at(camera.position.z, mouseIntersectPoint);

  let particlesInOrbit = 0;
  let particlesInOrbit2 = 0;

  // First loop: Apply gravitational and repulsion forces for first system
  for (let i = 0; i < particleCount; i++) {
    const index = i * 3;
    let x = positions[index];
    let y = positions[index + 1];
    let z = positions[index + 2];

    const particlePosition = new THREE.Vector3(x, y, z);
    const distanceVector = particlePosition.sub(mouseIntersectPoint);
    const distance = distanceVector.length();

    if (distance < mouseInfluenceRadius) {
      particlesInOrbit++;

      // Calculate gravitational force
      const force = G / (distance * distance);
      const acceleration = force * dt;

      // Update velocities for orbit
      const perpVector = new THREE.Vector3(
        -distanceVector.y,
        distanceVector.x,
        0
      ).normalize();
      velocities[index] +=
        perpVector.x * acceleration - distanceVector.x * acceleration * 0.5;
      velocities[index + 1] +=
        perpVector.y * acceleration - distanceVector.y * acceleration * 0.5;
      velocities[index + 2] +=
        perpVector.z * acceleration - distanceVector.z * acceleration * 0.5;

      // Color based on being affected by the cursor
      const influenceFactor = 1 - distance / mouseInfluenceRadius;
      colors[index] = 0.8 * influenceFactor + 0.1 * (1 - influenceFactor); // Red
      colors[index + 1] = 0.7 * influenceFactor + 0.1 * (1 - influenceFactor); // Green
      colors[index + 2] = 0.7 * influenceFactor + 0.2 * (1 - influenceFactor); // Blue (warm light color)
    } else {
      // Particles outside influence stay blue
      colors[index] = 0.1; // Blue
      colors[index + 1] = 0.1; // Blue
      colors[index + 2] = 0.8; // Blue
    }
  }

  // First loop: Apply gravitational and repulsion forces for second system
  for (let i = 0; i < particleCount2; i++) {
    const index = i * 3;
    let x = positions2[index];
    let y = positions2[index + 1];
    let z = positions2[index + 2];

    const particlePosition = new THREE.Vector3(x, y, z);
    const distanceVector = particlePosition.sub(mouseIntersectPoint);
    const distance = distanceVector.length();

    if (distance < mouseInfluenceRadius) {
      particlesInOrbit2++;

      // Calculate gravitational force
      const force = G / (distance * distance);
      const acceleration = force * dt;

      // Update velocities for orbit
      const perpVector = new THREE.Vector3(
        -distanceVector.y,
        distanceVector.x,
        0
      ).normalize();
      velocities2[index] +=
        perpVector.x * acceleration - distanceVector.x * acceleration * 0.5;
      velocities2[index + 1] +=
        perpVector.y * acceleration - distanceVector.y * acceleration * 0.5;
      velocities2[index + 2] +=
        perpVector.z * acceleration - distanceVector.z * acceleration * 0.5;

      // Color based on being affected by the cursor
      const influenceFactor = 1 - distance / mouseInfluenceRadius;
      colors2[index] = 0.8 * influenceFactor + 0.1 * (1 - influenceFactor); // Red
      colors2[index + 1] = 0.7 * influenceFactor + 0.1 * (1 - influenceFactor); // Green
      colors2[index + 2] = 0.7 * influenceFactor + 0.2 * (1 - influenceFactor); // Blue (warm light color)
    } else {
      // Particles outside influence stay dark orange
      colors2[index] = 0.8; // Dark orange
      colors2[index + 1] = 0.4; // Dark orange
      colors2[index + 2] = 0.0; // Dark orange
    }
  }

  // Second loop: Update positions and apply constraints for first system
  for (let i = 0; i < particleCount; i++) {
    const index = i * 3;

    // Apply velocity
    positions[index] += velocities[index] * dt;
    positions[index + 1] += velocities[index + 1] * dt;
    positions[index + 2] += velocities[index + 2] * dt;

    // Apply damping
    velocities[index] *= damping;
    velocities[index + 1] *= damping;
    velocities[index + 2] *= damping;

    // Keep particles within bounds
    const newDistance = Math.sqrt(
      positions[index] ** 2 +
        positions[index + 1] ** 2 +
        positions[index + 2] ** 2
    );
    if (newDistance > maxDistance) {
      const scale = maxDistance / newDistance;
      positions[index] *= scale;
      positions[index + 1] *= scale;
      positions[index + 2] *= scale;
    }
  }

  // Second loop: Update positions and apply constraints for second system
  for (let i = 0; i < particleCount2; i++) {
    const index = i * 3;

    // Apply velocity
    positions2[index] += velocities2[index] * dt;
    positions2[index + 1] += velocities2[index + 1] * dt;
    positions2[index + 2] += velocities2[index + 2] * dt;

    // Apply damping
    velocities2[index] *= damping;
    velocities2[index + 1] *= damping;
    velocities2[index + 2] *= damping;

    // Keep particles within bounds
    const newDistance = Math.sqrt(
      positions2[index] ** 2 +
        positions2[index + 1] ** 2 +
        positions2[index + 2] ** 2
    );
    if (newDistance > maxDistance) {
      const scale = maxDistance / newDistance;
      positions2[index] *= scale;
      positions2[index + 1] *= scale;
      positions2[index + 2] *= scale;
    }
  }

  // Update audio volume based on particles in orbit
  if (gainNode && audioContext.state === "running") {
    const volumePercentage = Math.min(
      (particlesInOrbit + particlesInOrbit2) / (particleCount + particleCount2),
      1
    );
    const minVolume = 0.01; // 1% minimum volume
    const maxVolume = 1.0; // 100% maximum volume
    const volume = minVolume + (maxVolume - minVolume) * volumePercentage;
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    console.log(
      "Particles in orbit:",
      particlesInOrbit + particlesInOrbit2,
      "Volume:",
      volume.toFixed(2)
    );
  }

  particles.attributes.position.needsUpdate = true;
  particles.attributes.color.needsUpdate = true;
  particles2.attributes.position.needsUpdate = true;
  particles2.attributes.color.needsUpdate = true;
  composer.render();
}

// Add glow effect
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // Strength
  0.4, // Radius
  0.85 // Threshold
);
composer.addPass(bloomPass);

// Call animation function
animate();

// Code for responsiveness
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize, false);
onWindowResize();
