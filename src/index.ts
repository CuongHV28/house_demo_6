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

import { 
    addWallWithDoorAndWindow,
    addHoleOnWallCSG,
    addWallWithHoles,
    addFloorCustom
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


const windowSettings1: IHoleSettings = {
  width: 1.5,
  height: 1.5,
  offsetLeft: 0.3,
  top: 5,
}

const doorSettings1: IHoleSettings = {
  width: 2,
  height: 2.5,
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
  height: 2.5,
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
  height: 6,
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
  height: 6,
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
  height: 6,
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
  height: 6,
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

// Create the first floor
const floorCustom = addFloorCustom(wallSettings1, wallSettings2, wallSettings3, wallSettings4, wallMaterial);
floorCustom.position.set(0, 4, 0);
scene.add(floorCustom);


// Function to add a new floor

// Function to add floors based on user input
function addHouse(numberOfFloors: number) {
  // Basic validation
  if (numberOfFloors < 1 || !Number.isInteger(numberOfFloors)) {
    console.error('Invalid number of floors. Please enter a positive integer.');
    return; // Exit the function if validation fails
  }

  for (let i = 0; i < numberOfFloors; i++) {
    const newFloor = addFloorCustom(wallSettings1, wallSettings2, wallSettings3, wallSettings4, wallMaterial);
    newFloor.position.set(0, 4 + i * wallSettings1.height, 0);
    scene.add(newFloor);
  }
}

// Function to reset the scene
function resetHouse() {
  // Reset the number of floors to its default value
  floorData.numberOfFloors = 1; // Assuming 1 is the default value

  // Reset other settings to their default values if needed
  // e.g., floorData.someOtherSetting = defaultValue;

  // Update the GUI to reflect the reset values
  updateGUIController();
  // Remove all floors from the scene
  removeAllFloors();
  // Add the default floor back
  addHouse(1);
}

function updateGUIController() {
  const numberOfFloorsController = floorFolder.__controllers.find(controller => controller.property === 'numberOfFloors');
  if (numberOfFloorsController) {
    numberOfFloorsController.setValue(floorData.numberOfFloors);
    // Rebind or refresh the GUI if necessary here
  } else {
    console.error('numberOfFloors controller not found in floorFolder');
  }
}

// Function to remove all floors from the scene
function removeAllFloors() {
  // Assuming the floors are added to the scene directly
  // You may need to adjust this based on your scene setup
  const floors = scene.children.filter(child => child instanceof THREE.Group && child.name !== 'GroundPlane');
  floors.forEach(floor => scene.remove(floor));
}

// Create a new dat.GUI instance
const gui = new dat.GUI();

// Create a folder for floor settings
const floorFolder = gui.addFolder('Floor Settings');

// Object to hold user input
const floorData = {
  numberOfFloors: 1, // Default to 1 floor
  addHouse: function() { addHouse(this.numberOfFloors); }, // Function to add floors
  resetHouse: function() { resetHouse(); } // Function to reset floors
};

// Add a controller for the number of floors within the folder
floorFolder.add(floorData, 'numberOfFloors', 1, 10).name('Number of Floors').step(1);

// Add a button to the folder to trigger the addition of new floors
floorFolder.add(floorData, 'addHouse').name('Add Floors');
floorFolder.add(floorData, 'resetHouse').name('Reset');

// Open the folder by default to draw attention to it
floorFolder.open();



function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();