import * as THREE from 'three';

import { colors, 
  groundMaterial, 
  floorMaterial, 
  roofMaterial, 
  windowMaterial, 
  wallMaterial, 
  woodMaterial, 
  normalMaterial, 
  standartMaterial, 
  lambert, 
  phongMaterial } from './materials';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IHoleSettings, IWallSettings } from './shapes/baseShapes';

import {
  Evaluator,
  EdgesHelper,
  Operation,
  OperationGroup,
  ADDITION,
  SUBTRACTION,
  Brush,
} from "three-bvh-csg";

import { IHouseSide } from './houses/types';
import { CSG } from 'three-csg-ts';



// init scene
let scene = new THREE.Scene();

scene.background = new THREE.Color(colors.background);

// init camera
const isocamera = false;

let camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;

let cameraSettings = {
  position: new THREE.Vector3(),
  lookAt: new THREE.Vector3(),
  fov: 45,
  far: 250,
};

if (isocamera) {
  const aspect = window.innerWidth / window.innerHeight;
  const d = 20;
  camera = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    1,
    4000
  );

  camera.position.set(20, 20, 20);
  camera.rotation.order = "YXZ";
  camera.rotation.y = -Math.PI / 4;
  camera.rotation.x = Math.atan(-1 / Math.sqrt(2));
} else {
  let cameraPositionFront = {
    fov: 15,
    far: 250,
    position: new THREE.Vector3(0, 7, 60),
    lookAt: new THREE.Vector3(0, 5, 0),
  };
  let cameraPositionAngled = {
    fov: 45,
    far: 250,
    position: new THREE.Vector3(15, 15, 20),
    lookAt: new THREE.Vector3(0, 5, 0),
  };
  let cameraPositionISO = {
    fov: 15,
    far: 250,
    position: new THREE.Vector3(50, 20, 50),
    lookAt: new THREE.Vector3(0, 5, 0),
  };
  cameraSettings = cameraPositionAngled;
  camera = new THREE.PerspectiveCamera(
    cameraSettings.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    cameraSettings.far
  );
  camera.position.copy(cameraSettings.position);
}


// init renderer
const canvas = document.querySelector('.webgl') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (event) => {
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// init controls
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.target = cameraSettings.lookAt;

// add light 
// Add ambient and directional lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Adjust renderer settings for improved lighting effects
renderer.physicallyCorrectLights = true;
renderer.gammaFactor = 2.2;
renderer.gammaOutput = true;

// add a ground plane
const groundPlane = new THREE.Mesh(
    new THREE.CylinderGeometry(30, 30, 1, 32),
    groundMaterial
  );
groundPlane.position.y = -0.5;
groundPlane.castShadow = true;
groundPlane.receiveShadow = true;
// The ground plane is at y = -0.5, and its height is 1
const groundPlaneHeight = 1;
const groundPlaneYPosition = -0.5;
scene.add(groundPlane);

// const wallSettings1: IWallSettings = {
//   width: 10,
//   height: 8,
//   depth: 0.5,
//   material: wallMaterial,
//   position: {
//     x: undefined,
//     y: 0,
//     z: undefined
//   }
// }
// const wallGeo1 = new THREE.BoxGeometry(wallSettings1.width, wallSettings1.height, wallSettings1.depth);
// const wallMesh1 = new THREE.Mesh(wallGeo1, wallMaterial);
// wallMesh1.position.set(0, 4, 0);
// scene.add(wallMesh1);

// const windowSettings1: IHoleSettings = {
//   width: 2,
//   height: 2,
//   offsetLeft: 2,
//   top: 5,
// }
// const windowGeo1 = new THREE.BoxGeometry(windowSettings1.width, windowSettings1.height, wallMesh1.geometry.parameters.depth);
// const windowMesh1 = new THREE.Mesh(windowGeo1, windowMaterial);
// // windowMesh.position.set(wallMesh.position.x - windowSettings.offsetLeft, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + windowSettings.top, wallMesh.position.z);
// // scene.add(windowMesh);

// const doorSettings1: IHoleSettings = {
//   width: 2,
//   height: 5,
//   offsetLeft: -1,
// }
// const doorGeo1 = new THREE.BoxGeometry(doorSettings1.width, doorSettings1.height, wallMesh1.geometry.parameters.depth);
// const doorMesh1= new THREE.Mesh(doorGeo1, windowMaterial);
// // doorMesh.position.set(wallMesh.position.x - doorSettings.offsetLeft, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + doorGeo.parameters.height/2, wallMesh.position.z);
// // scene.add(doorMesh);

// let doorMatrix1 = new THREE.Matrix4();
// doorMatrix1.makeTranslation(wallMesh1.position.x + doorSettings1.offsetLeft, -(wallMesh1.position.y - wallMesh1.geometry.parameters.height / 2) - doorSettings1.height / 2, wallMesh1.position.z);

// let windowMatrix1 = new THREE.Matrix4();
// windowMatrix1.makeTranslation(wallMesh1.position.x + windowSettings1.offsetLeft, wallMesh1.position.y - wallMesh1.geometry.parameters.height / 2 + windowGeo1.parameters.height/2, wallMesh1.position.z);

// doorMesh1.applyMatrix4(doorMatrix1);
// windowMesh1.applyMatrix4(windowMatrix1);

// const wallCSG = CSG.fromMesh(wallMesh1);
// const doorCSG = CSG.fromMesh(doorMesh1, doorMatrix1);
// const windowCSG = CSG.fromMesh(windowMesh1, windowMatrix1);

// const wallWithDoor = wallCSG.subtract(doorCSG);
// const wallWithDoorAndWindow = wallWithDoor.subtract(windowCSG);

// const resultMesh = wallWithDoorAndWindow.toMesh(wallMesh1.matrix);
// resultMesh.material = wallMaterial;
// resultMesh.position.set(wallMesh1.position.clone().x, wallMesh1.position.clone().y, wallMesh1.position.clone().z);
// scene.remove(wallMesh1);
// scene.add(resultMesh);

/////////////////////////////////////////////////////
// function to create a wall with a door and a window
function addWallWithDoorAndWindow(wallSettings: IWallSettings, doorSettings: IHoleSettings, windowSettings: IHoleSettings) : THREE.Mesh {
  const wallGeo = new THREE.BoxGeometry(wallSettings.width, wallSettings.height, wallSettings.depth);
  const wallMesh = new THREE.Mesh(wallGeo, wallMaterial);
  wallMesh.position.set(0, 4, 0);
  scene.add(wallMesh);

  const windowGeo = new THREE.BoxGeometry(windowSettings.width, windowSettings.height, wallMesh.geometry.parameters.depth);
  const windowMesh = new THREE.Mesh(windowGeo, windowMaterial);
  // windowMesh.position.set(wallMesh.position.x - windowSettings.offsetLeft, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + windowSettings.top, wallMesh.position.z);
  // scene.add(windowMesh);

  const doorGeo = new THREE.BoxGeometry(doorSettings.width, doorSettings.height, wallMesh.geometry.parameters.depth);
  const doorMesh = new THREE.Mesh(doorGeo, windowMaterial);
  // doorMesh.position.set(wallMesh.position.x - doorSettings.offsetLeft, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + doorGeo.parameters.height/2, wallMesh.position.z);
  // scene.add(doorMesh);

  let doorMatrix = new THREE.Matrix4();
  doorMatrix.makeTranslation(wallMesh.position.x + doorSettings.offsetLeft, -(wallMesh.position.y - wallMesh.geometry.parameters.height / 2) - doorSettings.height / 2, wallMesh.position.z);

  let windowMatrix = new THREE.Matrix4();
  windowMatrix.makeTranslation(wallMesh.position.x + windowSettings.offsetLeft, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + doorGeo.parameters.height/2, wallMesh.position.z);

  doorMesh.applyMatrix4(doorMatrix);
  windowMesh.applyMatrix4(windowMatrix);

  const wallCSG = CSG.fromMesh(wallMesh);
  const doorCSG = CSG.fromMesh(doorMesh, doorMatrix);
  const windowCSG = CSG.fromMesh(windowMesh, windowMatrix);

  const wallWithDoor = wallCSG.subtract(doorCSG);
  const wallWithDoorAndWindow = wallWithDoor.subtract(windowCSG);

  const resultMesh = wallWithDoorAndWindow.toMesh(wallMesh.matrix);
  resultMesh.material = wallMaterial;
  return resultMesh;
}

const wallSettings2: IWallSettings = {
  width: 5,
  height: 8,
  depth: 0.5,
  material: wallMaterial,
  position: {
    x: undefined,
    y: 0,
    z: undefined
  }
}
const windowSettings2: IHoleSettings = {
  width: 1,
  height: 1,
  offsetLeft: 2,
  top: 5,
}
const doorSettings2: IHoleSettings = {
  width: 3,
  height: 6,
  offsetLeft: -1,
}

const wallMesh2 = addWallWithDoorAndWindow(wallSettings2, doorSettings2, windowSettings2);
wallMesh2.position.set(10, 4, 0);
scene.add(wallMesh2);




function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();