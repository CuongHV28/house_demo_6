import * as THREE from "three";
import { floorMaterial, normalMaterial, wallMaterial } from "../materials";
import { IBalconySettings, IDoorSettings, IStairsSettings, IWallSettings } from "../shapes/baseShapes";

const wallHeight = 6;
const wallDepth = 0.25;

const windowSettings1 : IDoorSettings = {
    width: 0.1,
    height: 0.1,
    depth: 1,
    offsetLeft: 0.5,
    offsetGround: 0.8,
};

const windowSettings2 : IDoorSettings = {
    width: 0.2,
    height: 0.2,
    depth: 1,
    offsetLeft: 0.9,
    offsetGround: 0.5,
};

const windowSettings3 : IDoorSettings = {
    width: 0.2,
    height: 0.2,
    depth: 1,
    offsetLeft: 0.25,
    offsetGround: 0.5,
};

const windowSettings4 : IDoorSettings = {
    width: 0.2,
    height: 0.2,
    depth: 1,
    offsetLeft: 0.25,
    offsetGround: 0.5,
};

const balconySettings1 : IBalconySettings = {
    width: 3,
    height: 0.3,
    depth: 2,
    isFullLength: true,
    material: normalMaterial,
};

const balconySettings2 : IBalconySettings = {
    width: 3,
    height: 0.3,
    depth: 2,
    isFullLength: false,
    material: normalMaterial,
};

const doorSettings1 : IDoorSettings = {
    width: 0.25,
    height: 0.6,
    depth: 1,
    offsetLeft: 0.5,
    offsetGround: 0,
    balcony: undefined,
};

const doorSettings2 : IDoorSettings = {
    width: 0.3,
    height: 0.6,
    depth: 1,
    offsetLeft: 0.6,
    offsetGround: 0,
    balcony: balconySettings2,
};


const floorThickness = 0.1; // Thickness of the floor
//stairs settings
const stepWidth = 1;
const steps = 10;
const stepHeight = (wallHeight - floorThickness) / steps;

const stairSettings: IStairsSettings = {
    steps: steps,
    stepWidth: stepWidth,
    stepHeight: stepHeight,
    stepDepth: 0.5,
    material: new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    position: {
        x: 0,
        y: 0,
        z: 0
    }
};



export class LargeLateralModel {
    public static frontWallSettings : IWallSettings = {
        width: 5,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        doors: [doorSettings1],
        windows: [windowSettings1, windowSettings2],
        stairs: undefined,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static leftWallSettings : IWallSettings = {
        width: 10,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        doors: [doorSettings2],
        windows: [windowSettings3],
        stairs: stairSettings,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static backWallSettings : IWallSettings = {
        width: 5,
        height: 6,
        depth: 0.25,
        material: wallMaterial,
        doors: [],
        windows: [windowSettings1],
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static rightWallSettings : IWallSettings = {
        width: 10,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        stairs: undefined,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static roofFrontWallSettings : IWallSettings = {
        width: 5,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static roofLeftWallSettings : IWallSettings = {
        width: 10,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static boxWallLeftSettings : IWallSettings = {
        width: 4,
        height: 5,
        depth: wallDepth,
        material: floorMaterial,
        doors: [doorSettings2],
        windows: undefined,
        stairs: undefined,
        position: {
            x: 0,
            y: 0,
            z: 0
        }
    };
    public static boxWallNoDoorSettings : IWallSettings = {
        width: 4,
        height: 5,
        depth: wallDepth,
        material: floorMaterial,
        doors: undefined,
        windows: undefined,
        stairs: undefined,
        position: {
            x: 0,
            y: 0,
            z: 0
        }
    };
    public static floorThickness = floorThickness;
    public static stairSettings = stairSettings;
    public static wallHeight = wallHeight;
    public static wallDepth = wallDepth;
}