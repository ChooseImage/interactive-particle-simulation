import * as THREE from "three";
import { gsap } from "gsap";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// Three JS
window.addEventListener("load", init, false);
function init() {
  console.log("Init Functions");
  createWorld();
  createLights();
  createGrid();
  createGUI();
  createSkin();
  createLife();
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
  requestAnimationFrame(createLife);
  renderer.render(scene, camera);
}

const fragmentShader = `
  //
  // GLSL textureless classic 3D noise "cnoise",
  // with an RSL-style periodic variant "pnoise".
  // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
  // Version: 2011-10-11
  //
  // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
  // Distributed under the MIT license. See LICENSE file.
  // https://github.com/ashima/webgl-noise
  //
  vec3 mod289(vec3 x)
  {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec4 mod289(vec4 x)
  {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec4 permute(vec4 x)
  {
  return mod289(((x*34.0)+1.0)*x);
  }
  vec4 taylorInvSqrt(vec4 r)
  {
  return 1.79284291400159 - 0.85373472095314 * r;
  }
  vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
  }
  // Classic Perlin noise
  float cnoise(vec3 P)
  {
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
  }
  // Classic Perlin noise, periodic variant
  float pnoise(vec3 P, vec3 rep)
  {
    vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 10.0 * n_xyz;
  }
  varying vec3 vNormal;
  uniform sampler2D tShine;
  uniform float time;
  uniform float RGBr;
  uniform float RGBg;
  uniform float RGBb;
  uniform float RGBn;
  uniform float RGBm;
  uniform float dnoise;
  
  float PI = 3.14159265358979323846264;
  void main() {
    float r = ( pnoise( RGBr * ( vNormal + time ), vec3( 10.0 ) ) );
    float g = ( pnoise( RGBg * ( vNormal + time ), vec3( 10.0 ) ) );
    float b = ( pnoise( RGBb * ( vNormal + time ), vec3( 10.0 ) ) );
    float n = pnoise( -1.0 * ( vNormal + time ), vec3( 10.0 ) );
    //n = pow( 1.0, n );
    n = 50.0 * pnoise( (RGBn) * ( vNormal ), vec3( 10.0 ) ) * pnoise( RGBm * ( vNormal + time ), vec3( 10.0 ) );
    n -= 0.10 * pnoise( dnoise * vNormal, vec3( 10.0 ) );
    vec3 color = vec3( r + n, g + n, b + n );
    gl_FragColor = vec4( color, 1.0 );
  }
`;

const noiseVertexShader = `
 //
  // GLSL textureless classic 3D noise "cnoise",
  // with an RSL-style periodic variant "pnoise".
  // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
  // Version: 2011-10-11
  //
  // Many thanks to Ian McEwan of Ashima Arts for the
  // ideas for permutation and gradient selection.
  //
  // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
  // Distributed under the MIT license. See LICENSE file.
  // https://github.com/ashima/webgl-noise
  //
  vec3 mod289(vec3 x)
  {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec4 mod289(vec4 x)
  {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  vec4 permute(vec4 x)
  {
  return mod289(((x*34.0)+1.0)*x);
  }
  vec4 taylorInvSqrt(vec4 r)
  {
  return 1.79284291400159 - 0.85373472095314 * r;
  }
  vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
  }
  // Classic Perlin noise
  float cnoise(vec3 P)
  {
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 1.2 * n_xyz;
  }
  // Classic Perlin noise, periodic variant
  float pnoise(vec3 P, vec3 rep)
  {
    vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.0 * n_xyz;
  }
  varying vec3 vNormal;
  uniform float time;
  uniform float weight;
  uniform float morph;
  uniform float psize;
  
  void main() {
    float f = morph * pnoise( normal + time, vec3( 10.0 ) );
    vNormal = normalize(normal);
    vec4 pos = vec4( position + f * normal, 1.0 );
    gl_Position = projectionMatrix * modelViewMatrix * pos;
    gl_PointSize = psize;
  }
`;
