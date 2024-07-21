import * as THREE from "three";
import { floorMaterial, normalMaterial, wallMaterial } from "../materials";
import { IBalconySettings, IDoorSettings, IStairsSettings, IWallSettings } from "../shapes/baseShapes";

const wallWidth = 10;
const wallHeight = 6;
const wallDepth = 0.25;

export const LargeSidePlain: IWallSettings = {
    width: wallWidth,
    height: wallHeight,
    depth: wallDepth,
    material: wallMaterial,
    doors: undefined,
    windows: undefined,
    stairs: undefined,
    position: {
        x: 0,
        y: 0,
        z: 0
    }
}