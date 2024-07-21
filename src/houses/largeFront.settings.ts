import * as THREE from "three";
import { floorMaterial, normalMaterial, wallMaterial } from "../materials";
import { IBalconySettings, IDoorSettings, IStairsSettings, IWallSettings } from "../shapes/baseShapes";

import { largeSideD1W2S1 } from "../shapes/largeSide.d1.w2.s1";
import { LargeSidePlain } from "../shapes/largeSide.plain";
import { LargeSideW1 } from "../shapes/largeSide.w1";
import { SmallSidePlain } from "../shapes/smallSide.plain";
import { SmallSideD1 } from "../shapes/smallSide.d1";
import { SmallSideD1W1 } from "../shapes/smallSide.d1.w1";
import { RoofBoxWallPlain } from "../shapes/roofBoxWall.plain";
import { RoofBoxWallD1 } from "../shapes/roofBoxWall.d1";

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
    offsetLeft: 0.2,
    offsetGround: 0,
    balcony: balconySettings1,
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
const steps = 10;
const stepWidth = 1;
const stepHeight = (6 - floorThickness) / steps;
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



export class LargeFrontModel {
    public static frontWallSettings : IWallSettings = largeSideD1W2S1;
    public static leftWallSettings : IWallSettings = SmallSideD1W1;
    public static backWallSettings : IWallSettings = LargeSideW1;
    public static rightWallSettings : IWallSettings = SmallSideD1;
    public static roofFrontWallSettings : IWallSettings = {
        width: 10,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static roofLeftWallSettings : IWallSettings = {
        width: 5,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static roofBoxSettings = {
        frontSide: RoofBoxWallPlain,
        leftSide: RoofBoxWallD1,
        rightSide: RoofBoxWallPlain,
        backSide: RoofBoxWallPlain,
    };
    public static floorThickness = floorThickness;
    public static stairSettings = stairSettings;
    public static wallHeight = wallHeight;
    public static wallDepth = wallDepth;
}