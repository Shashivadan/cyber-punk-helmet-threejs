import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import gsap from "gsap";

import LocomotiveScroll from "locomotive-scroll";

const scroll = new LocomotiveScroll();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let model = null;

const rgbLoader = new RGBELoader();
rgbLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/4k/studio_small_03_4k.hdr",
  (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    // scene.background = envMap;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();

    const loader = new GLTFLoader();
    loader.load(
      "./public/DamagedHelmet.gltf",
      (gltf) => {
        scene.add(gltf.scene);
        model = gltf.scene;
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );
  }
);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const effectPass = new ShaderPass(RGBShiftShader);
effectPass.uniforms["amount"].value = 0.0025;
composer.addPass(effectPass);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("mousemove", (e) => {
  if (model) {
    gsap.to(model.rotation, {
      y: (e.clientX / window.innerWidth - 0.5) * (Math.PI * 0.12),
      x: (e.clientY / window.innerHeight - 0.5) * (Math.PI * 0.12),
      duration: 0.1, // adjust the duration as needed
      ease: "power2.out", // adjust the easing as needed0
    });
  }
});

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}

animate();
