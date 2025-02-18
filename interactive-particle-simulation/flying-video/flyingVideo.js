import * as THREE from "three";
import { gsap } from "gsap";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// Three JS
window.addEventListener("load", init, false);
window.addEventListener("scroll", onScroll, false);

function init() {
  console.log("Init Functions");
  createWorld();
  createLights();
  createGrid();
  createGUI();
  createSkin();
  initAlpha(); // Initialize alpha value
  createLife();
}

function onScroll() {
  const scrollY = window.scrollY + 1;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = scrollY / maxScroll;

  options.perlin.morph = scrollFraction * 24;
  options.camera.zoom = 50 + scrollFraction * 300;
  uniforms.alpha.value = scrollFraction; // Update alpha based on scroll position
}

// Initialize alpha value based on initial scroll position
function initAlpha() {
  const scrollY = window.scrollY + 1;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = scrollY / maxScroll;
  uniforms.alpha.value = scrollFraction;
}

var Theme = {
  _gray: 0x222222,
  _dark: 0x000000, // Background
  _cont: 0x444444, // Lines
  _blue: 0x000fff,
  _red: 0xf00000, //
  _cyan: 0x00ffff, // Material
  _white: 0xf00589, // Lights
};

var scene, camera, renderer, container;
var _width, _height;
var _ambientLights, _lights, _rectAreaLight;
var _skin;
let _backlight, _rectAreaLightHelper, _frontlight;
let skinElement;

var mat;
var geo;
var groupMoon = new THREE.Object3D();

//--------------------------------------------------------------------
function createWorld() {
  _width = window.innerWidth;
  _height = window.innerHeight;
  //---
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(Theme._dark, 150, 320);
  // Remove the background color setting
  // scene.background = new THREE.Color(Theme._dark);
  scene.add(groupMoon);
  //---
  camera = new THREE.PerspectiveCamera(20, _width / _height, 1, 1000);
  camera.position.set(0, 10, 120);
  //---
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Set alpha to true
  renderer.setSize(_width, _height);
  renderer.shadowMap.enabled = true;
  //---
  document.body.appendChild(renderer.domElement);
  //---
  document.body.style.height = "300vh"; // Set body height to 300% of viewport height
  renderer.domElement.style.position = "sticky";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.height = "100vh";
  //---
  window.addEventListener("resize", onWindowResize, false);
  console.log("Create world");
}
function onWindowResize() {
  _width = window.innerWidth;
  _height = window.innerHeight;
  renderer.setSize(_width, _height);
  camera.aspect = _width / _height;
  camera.updateProjectionMatrix();
}
//--------------------------------------------------------------------
function createLights() {
  _ambientLights = new THREE.HemisphereLight(Theme._cont, Theme._white, 1);
  _backlight = new THREE.PointLight(Theme._white, 1);
  _backlight.position.set(-5, -20, -20);

  // RectAreaLight
  _rectAreaLight = new THREE.RectAreaLight(Theme._white, 20, 3, 3);
  _rectAreaLight.position.set(0, 0, 2);
  scene.add(_rectAreaLight);

  // ✅ Add RectAreaLightHelper
  _rectAreaLightHelper = new RectAreaLightHelper(_rectAreaLight);
  _rectAreaLight.add(_rectAreaLightHelper);

  // PointLight
  _frontlight = new THREE.PointLight(Theme._white, 2);
  _frontlight.position.set(20, 10, 0);

  // Add lights to the scene
  scene.add(_backlight);
  scene.add(_ambientLights);
  scene.add(_frontlight);
}

var uniforms = {
  time: {
    type: "f",
    value: 0.0,
  },
  RGBr: {
    type: "f",
    value: 0.0,
  },
  RGBg: {
    type: "f",
    value: 0.0,
  },
  RGBb: {
    type: "f",
    value: 0.0,
  },
  RGBn: {
    type: "f",
    value: 0.0,
  },
  RGBm: {
    type: "f",
    value: 0.0,
  },
  morph: {
    type: "f",
    value: 0.0,
  },
  dnoise: {
    type: "f",
    value: 0.0,
  },
  psize: {
    type: "f",
    value: 3.0,
  },
  alpha: {
    type: "f",
    value: 1.0,
  },
};

var options = {
  perlin: {
    time: 5.0,
    morph: 0.0,
    dnoise: 2.5,
  },
  chroma: {
    RGBr: 4.5,
    RGBg: 0.0,
    RGBb: 3.0,
    RGBn: 0.3,
    RGBm: 1.0,
  },
  camera: {
    zoom: 150,
    speedY: 0.6,
    speedX: 0.0,
    guide: false,
  },
  sphere: {
    wireframe: false,
    points: false,
    psize: 3,
  },
};

function randomMoon() {
  console.log("Hola moon");

  //gsap.to(options.perlin, 1, {morph: Math.random() * 20});
  //gsap.to(options.perlin, 2, {time: 1 + Math.random() * 4});
  //gsap.to(options.perlin, 1, {dnoise: Math.random() * 100});

  gsap.to(options.chroma, 1, { RGBr: Math.random() * 10 });
  gsap.to(options.chroma, 1, { RGBg: Math.random() * 10 });
  gsap.to(options.chroma, 1, { RGBb: Math.random() * 10 });

  gsap.to(options.chroma, 1, { RGBn: Math.random() * 2 });
  gsap.to(options.chroma, 1, { RGBm: Math.random() * 5 });

  /*options.perlin.time = 1;
  options.perlin.dnoise = 0;
  options.perlin.morph = 0;
  options.chroma.RGBr = Math.random() * 10;
  options.chroma.RGBg = Math.random() * 10;
  options.chroma.RGBb = Math.random() * 10;
  options.chroma.RGBn = Math.random() * 2;
  options.chroma.RGBm = Math.random() * 5;*/
}

function createGUI() {
  var gui = new GUI(); // Use GUI instead of dat.GUI

  var camGUI = gui.addFolder("Camera");
  camGUI.add(options.camera, "zoom", 50, 250).name("Zoom").listen();
  camGUI.add(options.camera, "speedY", -1, 1).name("Speed Y").listen();
  camGUI.add(options.camera, "speedX", 0, 1).name("Speed X").listen();
  camGUI.add(options.camera, "guide").name("Guide").listen(); // lil-gui does not require 'false' as second arg

  var timeGUI = gui.addFolder("Setup");
  timeGUI.add(options.perlin, "time", 0.0, 10.0).name("Speed").listen();
  timeGUI.add(options.perlin, "morph", 0.0, 20.0).name("Morph").listen();
  timeGUI.add(options.perlin, "dnoise", 0.0, 1000.0).name("DNoise").listen();

  var rgbGUI = gui.addFolder("RGB");
  rgbGUI.add(options.chroma, "RGBr", 0.0, 10.0).name("Red").listen();
  rgbGUI.add(options.chroma, "RGBg", 0.0, 10.0).name("Green").listen();
  rgbGUI.add(options.chroma, "RGBb", 0.0, 10.0).name("Blue").listen();
  rgbGUI.add(options.chroma, "RGBn", 0.0, 3.0).name("Black").listen();
  rgbGUI.add(options.chroma, "RGBm", 0.0, 1.0).name("Chroma").listen();

  var wirGUI = gui.addFolder("Sphere");
  wirGUI.add(options.sphere, "wireframe").name("Wireframe").listen();
  wirGUI.add(options.sphere, "points").name("Points").listen();
  wirGUI.add(options.sphere, "psize", 1.0, 10.0, 1).name("Point Size"); // lil-gui step is the fourth parameter

  console.log("GUI created");
}

skinElement = function (geo_frag = 5) {
  var geo_size = 20;
  if (geo_frag >= 5) geo_frag = 20;
  //---
  geo = new THREE.IcosahedronGeometry(geo_size, geo_frag);
  //---
  mat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    //attributes: attributes,
    side: THREE.DoubleSide,
    vertexShader: noiseVertexShader,
    fragmentShader: fragmentShader,
    wireframe: options.sphere.wireframe,
  });
  this.point = new THREE.Points(geo, mat);
  //---
  this.mesh = new THREE.Mesh(geo, mat);
  this.mesh.geometry.verticesNeedUpdate = true;
  this.mesh.geometry.morphTargetsNeedUpdate = true;
  this.mesh.reseivedShadow = true;
  this.mesh.castShadow = true;
  //---
  groupMoon.add(this.point);
  groupMoon.add(this.mesh);
  //---
};
//---
function createSkin() {
  _skin = new skinElement();
  _skin.mesh.scale.set(1, 1, 1);
  scene.add(_skin.mesh);
}

var gridHelper;

function createGrid(_gridY = -20) {
  gridHelper = new THREE.GridHelper(200, 20, Theme._cont, Theme._gray);
  gridHelper.position.y = _gridY;
  scene.add(gridHelper);
}

//--------------------------------------------------------------------

var frame = Date.now();
//---

let videoPlanes = [];
const videoTextures = [
  "video1.mp4",
  // "video2.mp4",
  // "video3.mp4",
  // Add more video paths as needed
];
const maxVideoPlanes = 7; // Define the maximum number of video planes

function createVideoPlane() {
  // 🛑 Ensure no more than `maxVideoPlanes`
  if (videoPlanes.length >= maxVideoPlanes) {
    console.warn("Max video planes reached. Removing oldest video.");
    removeOldestVideoPlane(); // ✅ Remove the oldest video before adding a new one
  }

  const video = document.createElement("video");
  video.src = videoTextures[Math.floor(Math.random() * videoTextures.length)];
  video.muted = true;
  video.loop = true;

  video.addEventListener("canplaythrough", () => {
    video.play();
    const texture = new THREE.VideoTexture(video);
    const geometry = new THREE.PlaneGeometry(10, 5);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);

    plane.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      -200
    );

    scene.add(plane);
    videoPlanes.push({ plane, video }); // ✅ Store both plane and video element
  });

  video.addEventListener("error", (e) => {
    console.error("Error loading video:", e);
  });

  video.load();
}

function removeOldestVideoPlane() {
  if (videoPlanes.length === 0) return;

  const oldest = videoPlanes.shift(); // Remove first video in the list
  scene.remove(oldest.plane); // Remove from the Three.js scene
  oldest.video.pause(); // Stop video playback
  oldest.video.src = ""; // Release video resource
  oldest.video.load(); // Reset video element
}

function updateVideoPlanes() {
  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollFraction = scrollY / maxScroll;

  videoPlanes.forEach((entry, index) => {
    entry.plane.position.z = -200 + scrollFraction * 250;
  });

  if (videoPlanes.length < maxVideoPlanes) {
    createVideoPlane();
  }
}

function createLife() {
  var time = Date.now();
  //---
  uniforms.time.value = (options.perlin.time / 10000) * (time - frame);
  uniforms.morph.value = options.perlin.morph;
  uniforms.dnoise.value = options.perlin.dnoise;
  //---
  gsap.to(camera.position, 2, { z: 300 - options.camera.zoom });
  //---
  _skin.mesh.rotation.y += options.camera.speedY / 100;
  _skin.mesh.rotation.z += options.camera.speedX / 100;
  //---
  _skin.point.rotation.y = _skin.mesh.rotation.y;
  _skin.point.rotation.z = _skin.mesh.rotation.z;
  gridHelper.rotation.y = _skin.mesh.rotation.y;
  //---
  mat.uniforms["RGBr"].value = options.chroma.RGBr / 10;
  mat.uniforms["RGBg"].value = options.chroma.RGBg / 10;
  mat.uniforms["RGBb"].value = options.chroma.RGBb / 10;
  mat.uniforms["RGBn"].value = options.chroma.RGBn / 100;
  mat.uniforms["RGBm"].value = options.chroma.RGBm;
  mat.uniforms["psize"].value = options.sphere.psize;
  //---
  gridHelper.visible = options.camera.guide;
  //---
  _skin.mesh.visible = !options.sphere.points;
  _skin.point.visible = options.sphere.points;
  //---
  mat.wireframe = options.sphere.wireframe;
  //---
  camera.lookAt(scene.position);
  //---
  updateVideoPlanes();
  //---
  requestAnimationFrame(createLife);
  renderer.render(scene, camera);
}

const fragmentShader = `
  varying vec3 vNormal;
  uniform float time;
  uniform float RGBr;
  uniform float RGBg;
  uniform float RGBb;
  uniform float RGBn;
  uniform float RGBm;
  uniform float dnoise;
  uniform float alpha;
  
  void main() {
    float r = ( RGBr * ( vNormal + time ) );
    float g = ( RGBg * ( vNormal + time ) );
    float b = ( RGBb * ( vNormal + time ) );
    float n = ( -1.0 * ( vNormal + time ) );
    n = 50.0 * (RGBn * ( vNormal )) * ( RGBm * ( vNormal + time ) );
    n -= 0.10 * ( dnoise * vNormal );
    vec3 color = vec3( r + n, g + n, b + n );
    gl_FragColor = vec4( color, alpha ); // Use alpha uniform
  }
`;

const noiseVertexShader = `
  varying vec3 vNormal;
  uniform float time;
  uniform float morph;
  uniform float psize;
  
  void main() {
    float f = morph * ( normal + time );
    vNormal = normalize(normal);
    vec4 pos = vec4( position + f * normal, 1.0 );
    gl_Position = projectionMatrix * modelViewMatrix * pos;
    gl_PointSize = psize;
  }
`;
