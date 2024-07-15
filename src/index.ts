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
import { IHoleSettings, IWallSettings, IBalconySettings } from './shapes/baseShapes';

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

import { 
    addWallWithDoorAndWindow,
    addHoleOnWallCSG,
    addWallWithHoles,
    addFloorCustom
} from './house';



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

const windowSettings2: IHoleSettings = {
  width: 1,
  height: 1,
  offsetLeft: 0.3,
  top: 1.5,
}
const doorSettings2: IHoleSettings = {
  width: 1.5,
  height: 4,
  offsetLeft: -0.1,
}

const balconySettings: IBalconySettings = {
  width: 3, // Example width of the balcony
  height: 0.5, // Example height of the balcony railing
  depth: 2, // Example depth (how far it extends from the wall)
  material: normalMaterial, // Assuming you have a balconyMaterial defined
  positionRelativeToDoor: 0, // Assuming the balcony is related to the first door in the doors array
  heightOffset: 2.5, // Example height offset from the base of the door
  position: {
    x: undefined,
    y: 0,
    z: undefined
  }
};

const wallSettings1: IWallSettings = {
  width: 10,
  height: 8,
  depth: 0.5,
  material: wallMaterial,
  doors: [doorSettings1],
  windows: [windowSettings1, windowSettings2],
  balcony: balconySettings,
  position: {
    x: undefined,
    y: 0,
    z: undefined
  }
}

const wallSettings2: IWallSettings = {
  width: 5,
  height: 8,
  depth: 0.5,
  material: wallMaterial,
  doors: [doorSettings2],
  windows: [windowSettings2],
  position: {
    x: undefined,
    y: 0,
    z: undefined
  }
}

const wallSettings3: IWallSettings = {
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

const wallSettings4: IWallSettings = {
  width: 10,
  height: 8,
  depth: 0.5,
  material: wallMaterial,
  doors: [],
  windows: [windowSettings1],
  position: {
    x: undefined,
    y: 0,
    z: undefined
  }
}

//function to add a floor
function addFloor(
  height, 
  frontwidth, 
  sidewidth, 
  thickness, 
  material
) {
  // add a floor with 4 sides with these settings: frontwidth, sidewidth, height, material
  // assume thickness is the same for all walls

  // create the left wall object with a door and a window
  const leftWallSettings: IWallSettings = {
    width: sidewidth,
    height: height,
    depth: thickness,
    material: material,
    position: {
      x: undefined,
      y: 0,
      z: undefined
    }
  }
  // create the front wall object with a door and a window
  const frontWallSettings: IWallSettings = {
    width: frontwidth,
    height: height,
    depth: thickness,
    material: material,
    position: {
      x: undefined,
      y: 0,
      z: undefined
    }
  }
  // create 4 walls with settings
  const leftWall = addWallWithDoorAndWindow(leftWallSettings, doorSettings1, windowSettings1);
  const frontWall = addWallWithDoorAndWindow(frontWallSettings, doorSettings2, windowSettings2);
  // create the right wall object with same settings as left wall but no door or window
  const rightWall = addWallWithDoorAndWindow(leftWallSettings);
  // create the back wall object with same settings as front wall but no door or window
  const backWall = addWallWithDoorAndWindow(frontWallSettings);
  
  addWallWithHoles
  // Position the walls
  // frontWall.position.set(6, 4, 20);
  // left wall
  leftWall.position.x = frontWall.position.x - (frontWallSettings.width / 2) + (leftWallSettings.depth / 2); 
  leftWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
  leftWall.position.z = frontWall.position.z + (frontWallSettings.depth / 2) - (leftWallSettings.width / 2); // Align with frontWall on the z-axis
  leftWall.rotation.y = -Math.PI / 2; // Rotate 90 degrees to make the angle
  // right wall opposite of left wall
  rightWall.position.x = leftWall.position.x + frontWallSettings.width;
  rightWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
  rightWall.position.z = leftWall.position.z; // Align with leftWall on the z-axis
  rightWall.rotation.y = Math.PI / 2; // Rotate to face the opposite direction
  // back wall opposite of front wall
  backWall.position.x = frontWall.position.x;
  backWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
  backWall.position.z = frontWall.position.z - leftWallSettings.width + frontWallSettings.depth; // Align with frontwall on the z-axis

  // scene.add(frontWall);
  // scene.add(leftWall);
  // scene.add(rightWall);
  // scene.add(backWall);

  // add a floor ground plane if needed
  const floorGeometry = new THREE.BoxGeometry(frontWallSettings.width + leftWallSettings.depth, 0.1, leftWallSettings.width); // depth is wallSettings1.width, width is wallSettings2.width, height is very thin (0.1)
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

  // Position the floor
  // Assuming wallMesh1.position.y is the base of the walls, adjust if necessary
  floorMesh.position.x = frontWall.position.x + (leftWallSettings.depth / 2); // Centered between wall2 and wall4
  floorMesh.position.y = frontWall.position.y - (frontWallSettings.height / 2); // Just below the walls, adjust if your wallMesh1.position.y is not the base
  floorMesh.position.z = leftWall.position.z; // Centered between wall1 and wall3

  // Add the floor to the scene
  // scene.add(floorMesh);
  const floorGroup = new THREE.Group();
  floorGroup.add(frontWall);
  floorGroup.add(leftWall);
  floorGroup.add(rightWall);
  floorGroup.add(backWall);
  floorGroup.add(floorMesh);

  return floorGroup;
}

// Create the first floor
const floorCustom = addFloorCustom(wallSettings1, wallSettings2, wallSettings3, wallSettings4, wallMaterial);
floorCustom.position.set(0, 4, 0);
scene.add(floorCustom);


const wallSettingsTest1: IWallSettings = {
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

//test add floor
const testFloor = addFloor(wallSettingsTest1.height, wallSettings2.width, wallSettings1.width,  wallSettingsTest1.depth, wallMaterial);
testFloor.position.set(6, 4, 20);
scene.add(testFloor);

// Create the first additional floor above the existing one
let floorAbove = addFloor(wallSettingsTest1.height, wallSettings2.width, wallSettings1.width, wallSettingsTest1.depth, wallMaterial);
// Position it above the existing floor. Adjust '4' if the base position of your floors is different.
floorAbove.position.set(6, 4 + wallSettingsTest1.height, 20);
scene.add(floorAbove);

// Create the first additional floor above the existing one
const floorAbove2 = addFloor(wallSettingsTest1.height, wallSettings2.width, wallSettings1.width, wallSettingsTest1.depth, wallMaterial);
// Position it above the existing floor. Adjust '4' if the base position of your floors is different.
floorAbove2.position.set(6, 4 + 2*wallSettingsTest1.height, 20);
scene.add(floorAbove2);

// Create the second additional floor below the existing one
const floorBelow = addFloor(wallSettingsTest1.height, wallSettings2.width, wallSettings1.width, wallSettingsTest1.depth, wallMaterial);
// Position it below the existing floor. Adjust '4' if the base position of your floors is different.
floorBelow.position.set(6, 4 - wallSettingsTest1.height, 20);
scene.add(floorBelow);


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();