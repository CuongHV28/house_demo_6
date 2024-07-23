import * as THREE from "three";
import { floorMaterial, normalMaterial, wallMaterial } from "../materials";
import { IBalconySettings, IDoorSettings, IStairsSettings, IWallSettings } from "../shapes/baseShapes";

import { LargeSideD1W2S1 } from "../shapes/largeSide.d1.w2.s1";
import { LargeSidePlain } from "../shapes/largeSide.plain";
import { LargeSideW1 } from "../shapes/largeSide.w1";
import { SmallSidePlain } from "../shapes/smallSide.plain";
import { SmallSideD1 } from "../shapes/smallSide.d1";
import { SmallSideD1W1 } from "../shapes/smallSide.d1.w1";
import { RoofBoxWallPlain } from "../shapes/roofBoxWall.plain";
import { RoofBoxWallD1 } from "../shapes/roofBoxWall.d1";
import { LargeSideD2 } from "../shapes/largeSide.d2";
import { LargeSideGarage } from "../shapes/largeSide.garage";
import { LargeSideD2W2Mid } from "../shapes/largeSide.d1.w2.mid";
import { LargeSideW2 } from "../shapes/largeSide.w2";
import { EqualSidePlain } from "../shapes/equalSide.plain";
import { EqualSideD1 } from "../shapes/equalSide.d1";
import { EqualSideD2 } from "../shapes/equalSide.d2";
import { EqualSideD1W1 } from "../shapes/equalSide.d1.w1";
import { EqualSideSideD1W2Mid } from "../shapes/equalSide.d1.w2.mid";
import { EqualSideW2 } from "../shapes/equalSide.w2";

const wallHeight = 6;
const wallDepth = 0.25;

const floorThickness = 0.1; // Thickness of the floor
//stairs settings
const stepWidth = 0.1;  // Width of each step is 0.1 * floorwidth
const steps = 10;
const stepHeight = 0.1; // Height of each step is 0.1 * height of the stair
const stepDepth = 0.1; // Depth of each step is 0.1 * width of the stair

const stairSettings: IStairsSettings = {
    steps: steps,
    stepWidth: stepWidth,
    stepHeight: stepHeight,
    stepDepth: stepDepth,
    material: new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
    position: {
        x: 0,
        y: 0,
        z: 0
    }
};


export class NhaCap4Model {
    public static frontWallSettings : IWallSettings = EqualSideD1W1;
    public static leftWallSettings : IWallSettings = EqualSidePlain;
    public static backWallSettings : IWallSettings = EqualSideD1;
    public static rightWallSettings : IWallSettings = EqualSideW2;
    public static roofFrontWallSettings : IWallSettings = {
        width: EqualSidePlain.width,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static roofLeftWallSettings : IWallSettings = {
        width: EqualSidePlain.width,
        height: wallHeight,
        depth: wallDepth,
        material: wallMaterial,
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
    };
    public static roofBoxSettings = undefined;
    public static floorThickness = floorThickness;
    public static stairSettings = stairSettings;
    public static wallHeight = wallHeight;
    public static wallDepth = wallDepth;
}