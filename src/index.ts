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



/////////////////////////////////////////////////////
// function addWallWithDoorAndWindow(wallSettings: IWallSettings, doorSettings: IHoleSettings, windowSettings: IHoleSettings): THREE.Mesh {
//   // Create wall mesh
//   const wallGeo = new THREE.BoxGeometry(wallSettings.width, wallSettings.height, wallSettings.depth);
//   const wallMesh = new THREE.Mesh(wallGeo, wallSettings.material);
//   wallMesh.position.set(wallSettings.position.x || 0, wallSettings.position.y, wallSettings.position.z || 0);

//   // Create window geometry and mesh
//   const windowGeo = new THREE.BoxGeometry(windowSettings.width, windowSettings.height, wallSettings.depth);
//   const windowMesh = new THREE.Mesh(windowGeo, windowMaterial);

//   // Create door geometry and mesh
//   const doorGeo = new THREE.BoxGeometry(doorSettings.width, doorSettings.height, wallSettings.depth);
//   const doorMesh = new THREE.Mesh(doorGeo, windowMaterial);

//   // Calculate and apply transformations for door and window
//   let doorMatrix = new THREE.Matrix4();
//   doorMatrix.makeTranslation(doorSettings.offsetLeft, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + doorSettings.height / 2, 0);

//   let windowMatrix = new THREE.Matrix4();
//   windowMatrix.makeTranslation(windowSettings.offsetLeft, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + windowSettings.top, 0);

//   doorMesh.applyMatrix4(doorMatrix);
//   windowMesh.applyMatrix4(windowMatrix);

//   // Perform CSG operations
//   const wallCSG = CSG.fromMesh(wallMesh);
//   const doorCSG = CSG.fromMesh(doorMesh);
//   const windowCSG = CSG.fromMesh(windowMesh);

//   const wallWithDoor = wallCSG.subtract(doorCSG);
//   const wallWithDoorAndWindow = wallWithDoor.subtract(windowCSG);

//   // Convert CSG back to THREE.Mesh, apply material, and adjust position
//   const resultMesh = wallWithDoorAndWindow.toMesh(new THREE.Matrix4());
//   resultMesh.material = wallSettings.material;
//   resultMesh.position.set(wallMesh.position.x, wallMesh.position.y, wallMesh.position.z);

//   // Clean up: Remove the original wall mesh from the scene if added
//   scene.remove(wallMesh);

//   // Add the final mesh to the scene
//   scene.add(resultMesh);

//   return resultMesh;
// }

function addWallWithDoorAndWindow(
  wallSettings: IWallSettings, 
  doorSettings?: IHoleSettings | null, 
  windowSettings?: IHoleSettings | null
): THREE.Mesh {
  // Create wall mesh
  const wallGeo = new THREE.BoxGeometry(wallSettings.width, wallSettings.height, wallSettings.depth);
  const wallMesh = new THREE.Mesh(wallGeo, wallSettings.material);
  wallMesh.position.set(wallSettings.position.x || 0, wallSettings.position.y, wallSettings.position.z || 0);
  if (doorSettings === undefined && windowSettings === undefined) {
    return wallMesh;
  }
  // Create window geometry and mesh
  const windowGeo = new THREE.BoxGeometry(windowSettings.width, windowSettings.height, wallSettings.depth);
  const windowMesh = new THREE.Mesh(windowGeo, windowMaterial);

  // Create door geometry and mesh
  const doorGeo = new THREE.BoxGeometry(doorSettings.width, doorSettings.height, wallSettings.depth);
  const doorMesh = new THREE.Mesh(doorGeo, windowMaterial);

  // Calculate offsets as ratios of the wall's width
  const doorOffsetX = doorSettings.offsetLeft * wallSettings.width; // Adjusted to use ratio
  const windowOffsetX = windowSettings.offsetLeft * wallSettings.width; // Adjusted to use ratio

  // Calculate and apply transformations for door and window using the new offsets
  let doorMatrix = new THREE.Matrix4();
  doorMatrix.makeTranslation(doorOffsetX, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + doorSettings.height / 2, 0);

  let windowMatrix = new THREE.Matrix4();
  windowMatrix.makeTranslation(windowOffsetX, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + windowSettings.top, 0);

  doorMesh.applyMatrix4(doorMatrix);
  windowMesh.applyMatrix4(windowMatrix);

  // Perform CSG operations
  const wallCSG = CSG.fromMesh(wallMesh);
  const doorCSG = CSG.fromMesh(doorMesh);
  const windowCSG = CSG.fromMesh(windowMesh);

  const wallWithDoor = wallCSG.subtract(doorCSG);
  const wallWithDoorAndWindow = wallWithDoor.subtract(windowCSG);

  // Convert CSG back to THREE.Mesh, apply material, and adjust position
  const resultMesh = wallWithDoorAndWindow.toMesh(new THREE.Matrix4());
  resultMesh.material = wallSettings.material;
  resultMesh.position.set(wallMesh.position.x, wallMesh.position.y, wallMesh.position.z);

  // Clean up: Remove the original wall mesh from the scene if added
  scene.remove(wallMesh);

  // Add the final mesh to the scene
  scene.add(resultMesh);

  return resultMesh;
}

const wallSettings1: IWallSettings = {
  width: 10,
  height: 8,
  depth: 0.5,
  material: wallMaterial,
  position: {
    x: undefined,
    y: 0,
    z: undefined
  }
}

const windowSettings1: IHoleSettings = {
  width: 2,
  height: 2,
  offsetLeft: 0.3,
  top: 5,
}

const doorSettings1: IHoleSettings = {
  width: 2,
  height: 5,
  offsetLeft: -0.2,
}

const wallMesh1 = addWallWithDoorAndWindow(wallSettings1, doorSettings1, windowSettings1);
wallMesh1.position.set(0, 4, 0);
scene.add(wallMesh1);

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
  offsetLeft: 0.3,
  top: 5.5,
}
const doorSettings2: IHoleSettings = {
  width: 1.5,
  height: 4,
  offsetLeft: -0.1,
}

const wallMesh2 = addWallWithDoorAndWindow(wallSettings2, doorSettings2, windowSettings2);
// wallMesh2.position.set(15, 4, 0);

wallMesh1.position.set(0, 4, 0); // Centered at the origin


// Position wall2 (Side Wall)
// It starts at the end of wall1 on the x-axis and aligns with wall1 on the z-axis
wallMesh2.position.x = wallMesh1.position.x - (wallSettings1.width / 2) + (wallSettings2.depth / 2); 
wallMesh2.position.y = wallMesh1.position.y; // Align with wall1 on the y-axis
wallMesh2.position.z = wallMesh1.position.z + (wallSettings1.depth / 2) + (wallSettings2.width / 2); // Align with wall1 on the z-axis
// wallMesh2.position.set(wallMesh1.position.x + (wallSettings1.width / 2) + (wallSettings2.depth / 2), 4, 0); // wall1's width / 2
wallMesh2.rotation.y = Math.PI / 2; // Rotate 90 degrees to make the angle
scene.add(wallMesh2);


// Clone wallMesh1 for wall3 (Back Wall) and rotate
const wallMesh3 = wallMesh1.clone();
wallMesh3.position.z = wallMesh1.position.z + wallSettings2.width; // Align with wall1 on the x-axis
wallMesh3.rotation.y = Math.PI; // Rotate to face the opposite direction

// Clone wallMesh2 for the other side wall (wall4)
const wallMesh4 = addWallWithDoorAndWindow(wallSettings2);
wallMesh4.position.x = wallMesh2.position.x + wallSettings1.width - wallSettings2.depth; // Align with wall2 on the x-axis
wallMesh4.position.y = wallMesh2.position.y; // Align with wall2 on the y-axis
wallMesh4.position.z = wallMesh2.position.z;
// wallMesh4.position.set(10 / 2, 4, -5); // Move it to the other end of wall1
wallMesh4.rotation.y = Math.PI / 2; // Rotate to face the opposite direction

// Add the walls to the scene
scene.add(wallMesh1);
scene.add(wallMesh2);
scene.add(wallMesh3);
scene.add(wallMesh4);

// Assuming Three.js and that wallMaterial can be used for the floor as well
const floorGeometry = new THREE.BoxGeometry(wallSettings1.width, 0.1, wallSettings1.depth + wallSettings2.width); // depth is wallSettings1.width, width is wallSettings2.width, height is very thin (0.1)
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

// Position the floor
// Assuming wallMesh1.position.y is the base of the walls, adjust if necessary
floorMesh.position.x = wallMesh1.position.x; // Centered between wall2 and wall4
floorMesh.position.y = wallMesh1.position.y - (wallSettings1.height / 2); // Just below the walls, adjust if your wallMesh1.position.y is not the base
floorMesh.position.z = wallMesh2.position.z - wallSettings1.depth / 2; // Centered between wall1 and wall3

// Add the floor to the scene
scene.add(floorMesh);

//function to add a floor
function addFloor() {
  // add a floor with 4 sides with these settings: frontwidth, backwidth, leftdepth, rightdepth, height, material
}


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();