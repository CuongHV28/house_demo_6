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
import { IHoleSettings, IWallSettings, IBalconySettings, IStairsSettings, IDoorSettings } from './shapes/baseShapes';
import { LargeFrontModel } from './houses/largeFront.settings';
import { LargeLateralModel } from './houses/largeLateral.settings';


import { LargeSideD1W2S1 } from "./shapes/largeSide.d1.w2.s1";
import { LargeSidePlain } from "./shapes/largeSide.plain";
import { LargeSideW1 } from "./shapes/largeSide.w1";
import { SmallSidePlain } from "./shapes/smallSide.plain";
import { SmallSideD1 } from "./shapes/smallSide.d1";
import { SmallSideD1W1 } from "./shapes/smallSide.d1.w1";
import { RoofBoxWallPlain } from "./shapes/roofBoxWall.plain";
import { RoofBoxWallD1 } from "./shapes/roofBoxWall.d1";

import {
  Evaluator,
  EdgesHelper,
  Operation,
  OperationGroup,
  ADDITION,
  SUBTRACTION,
  Brush,
} from "three-bvh-csg";

import { 
    addWallWithDoorAndWindow,
    addHoleOnWallCSG,
    addWallWithHoles,
    addFloorCustom,
    createStairs,
    addRoofTop
} from './house';
import * as dat from 'dat.gui';


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

// config for walls

const houseSettings = LargeFrontModel;
// const houseSettings = LargeLateralModel;

// Create the first floor
// const floorCustom = addFloorCustom(wallSettings1, wallSettings2, wallSettings3, wallSettings4, true, wallMaterial);
// floorCustom.position.set(0, 4, 0);
// scene.add(floorCustom);

// Function to add floors based on user input
let floorObjects: { name: string; walls: { front: THREE.Group<THREE.Object3DEventMap>; left: THREE.Group<THREE.Object3DEventMap>; back: THREE.Group<THREE.Object3DEventMap>; right: THREE.Group<THREE.Object3DEventMap>; }; }[] = [];

function addHouse(numberOfFloors: number) {
  // Basic validation
  if (numberOfFloors < 1 || !Number.isInteger(numberOfFloors)) {
    console.error('Invalid number of floors. Please enter a positive integer.');
    return; // Exit the function if validation fails
  }

  // Clear existing floors before adding new ones
  removeAllFloors();

  for (let i = 0; i < numberOfFloors; i++) {
    const newFloor = addFloorCustom(houseSettings.frontWallSettings, houseSettings.leftWallSettings, houseSettings.rightWallSettings, houseSettings.backWallSettings, houseSettings.stairSettings, wallMaterial);
    newFloor.position.set(0, 4 + i * houseSettings.wallHeight, 0);
    scene.add(newFloor);

    const frontWall = addWallWithHoles(houseSettings.frontWallSettings);
    const leftWall = addWallWithHoles(houseSettings.leftWallSettings);
    // create the right wall object with same settings as left wall but no door or window
    const rightWall = addWallWithHoles(houseSettings.rightWallSettings);
    // create the back wall object with same settings as front wall but no door or window 
    const backWall = addWallWithHoles(houseSettings.backWallSettings);

    frontWall.name = 'frontWall';
    leftWall.name = 'leftWall';
    rightWall.name = 'rightWall';
    backWall.name = 'backWall';

    floorObjects.push({
      name: `Floor ${i + 1}`,
      walls: {
        front: frontWall,
        left: leftWall,
        back: rightWall,
        right: backWall
      }
    });
  }

  // Create and position the roof
  const houseRoof = addRoofTop(houseSettings.roofFrontWallSettings, houseSettings.roofLeftWallSettings, houseSettings.roofLeftWallSettings, houseSettings.roofFrontWallSettings, houseSettings.roofBoxSettings, wallMaterial);
  houseRoof.position.set(0,numberOfFloors * houseSettings.wallHeight + houseSettings.wallHeight / 4, 0); // Adjust X and Z if necessary to align with your house dimensions
  scene.add(houseRoof);

  updateGUIController(); // Step 3: Update the GUI with the new list of floors
}

// Function to reset the scene
function resetHouse() {
  // Reset the number of floors to its default value
  floorData.numberOfFloors = 1; // Assuming 1 is the default value

  // Update the GUI to reflect the reset values
  updateGUIController();
  // Remove all floors from the scene
  removeAllFloors();
  // Add the default floor back
  addHouse(1);
}


function updateGUIController() {
  // Update the numberOfFloors controller
  const numberOfFloorsController = floorFolder.__controllers.find(controller => controller.property === 'numberOfFloors');
  if (numberOfFloorsController) {
    numberOfFloorsController.setValue(floorData.numberOfFloors);
  } else {
    console.error('numberOfFloors controller not found in floorFolder');
  }

  // Attempt to properly clear existing floor list entries
  Object.keys(floorListFolder.__folders).forEach(folderName => {
    const folder = floorListFolder.__folders[folderName];
    floorListFolder.removeFolder(folder);
  });
  // Reset the folders object to ensure it's clear
  floorListFolder.__folders = {};

  // Dynamically update the 'Floor List' folder with floors and walls
  floorObjects.forEach((floorObj, index) => {
    let floorFolderName = `Floor ${index}`;
    let floorFolder = floorListFolder.__folders[floorFolderName];
    // If the folder already exists, remove it (or you could choose to use it directly)
    if (floorFolder) {
      floorListFolder.removeFolder(floorFolder);
      floorFolder = null; // Ensure it's marked as removed
    }
    // Create a new folder since it doesn't exist or was just removed
    if (!floorFolder) {
      floorFolder = floorListFolder.addFolder(floorFolderName);
    }

    // Correctly iterate over the walls of the floor object
    Object.entries(floorObj.walls).forEach(([wallName, wall]) => {
      floorFolder.add({[`Show ${wallName}`]: () => handleWallClick(wall)}, `Show ${wallName}`);
    });
  });
}

let currentlyDisplayedWall : THREE.Mesh = null;

function handleWallClick(wall: THREE.Mesh) {
  // If there's already a wall displayed, remove it from the scene
  if (currentlyDisplayedWall) {
    scene.remove(currentlyDisplayedWall);
    currentlyDisplayedWall = null; // Reset the reference
  }

  // Clone the selected wall and adjust its position
  const wallCopy = wall.clone();
  wallCopy.position.y = 4; // Adjust the position as needed
  wallCopy.position.z += 10; // Adjust the position as needed

  // Add the cloned wall to the scene
  scene.add(wallCopy);

  // Update the global variable to reference the newly added cloned wall
  currentlyDisplayedWall = wallCopy;
}

// Function to remove all floors from the scene
function removeAllFloors() {
  // Remove all floors from the scene
  const floors = scene.children.filter(child => child instanceof THREE.Group && child.name !== 'GroundPlane');
  floors.forEach(floor => scene.remove(floor));
  floorObjects = []; // Clear the global list of floor objects
  updateGUIController(); // Update the GUI to reflect the removal
}


// List of walls created
// Define an array of wall objects
const walls = [
  { name: 'Large Side D1 W2 S1', module: LargeSideD1W2S1 },
  { name: 'Large Side Plain', module: LargeSidePlain },
  { name: 'Large Side W1', module: LargeSideW1 },
  { name: 'Small Side Plain', module: SmallSidePlain },
  { name: 'Small Side D1', module: SmallSideD1 },
  { name: 'Small Side D1 W1', module: SmallSideD1W1 },
  { name: 'Roof Box Wall Plain', module: RoofBoxWallPlain },
  { name: 'Roof Box Wall D1', module: RoofBoxWallD1 }
];

function updateWallList(walls: any[]) {
  // Clear existing list
  while (wallsListFolder.__controllers.length > 0) {
    wallsListFolder.remove(wallsListFolder.__controllers[0]);
  }

  // Add each wall to the "List Walls" folder
  walls.forEach(wall => {
    wallsListFolder.add(wall, 'name').name(wall.name).onChange(() => {
      // Interaction logic here, e.g., displaying wall details or editing
      console.log(`Selected: ${wall.name}`);
    });
  });
}


// Create a new dat.GUI instance
const gui = new dat.GUI();

// Create a folder for floor settings
const floorFolder = gui.addFolder('Floor Settings');
const floorListFolder = gui.addFolder('Floor List');
const wallsListFolder = gui.addFolder('List Walls');

// Object to hold user input
const floorData = {
  numberOfFloors: 1, // Default to 1 floor
  addHouse: function() { addHouse(this.numberOfFloors); }, // Function to add floors
  resetHouse: function() { resetHouse(); } // Function to reset floors
};

function init() {
  // Add a controller for the number of floors within the folder
  floorFolder.add(floorData, 'numberOfFloors', 1, 10).name('Number of Floors').step(1);

  // Add a button to the folder to trigger the addition of new floors
  floorFolder.add(floorData, 'addHouse').name('Add House');
  floorFolder.add(floorData, 'resetHouse').name('Reset');

  // Open the folder by default to draw attention to it
  floorFolder.open();
  addHouse(1); // Add the default floor
  
  updateGUIController(); // Update the GUI controller

  // Programmatically toggle the visibility of the floor list folder
  // floorListFolder.close(); // Close the folder
  floorListFolder.open(); // Then open it again

  // Update the list of walls
  updateWallList(walls);
}

init();

// const testRoof = addRoofTop(wallSettings1, wallSettings2, wallSettings3, wallSettings4, wallMaterial);
// testRoof.position.set(-10, 4, 7);
// scene.add(testRoof);




function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();