import * as THREE from "three";
import { floorMaterial, normalMaterial, wallMaterial } from "../materials";
import { IBalconySettings, IDoorSettings, IStairsSettings, IWallSettings } from "./baseShapes";

const wallWidth = 5;
const wallHeight = 6;
const wallDepth = 0.25;

const windowSettings1 : IDoorSettings = {
    width: 0.2,
    height: 0.4,
    depth: 1,
    offsetLeft: 0.3,
    offsetGround: 0.5,
};

const windowSettings2 : IDoorSettings = {
    width: 0.4,
    height: 0.4,
    depth: 1,
    offsetLeft: 0.7,
    offsetGround: 0.5,
};

const windowSettings3 : IDoorSettings = {
    width: 0.5,
    height: 0.5,
    depth: 1,
    offsetLeft: 0.5,
    offsetGround: 0.4,
};

const windowSettings4 : IDoorSettings = {
    width: 0.2,
    height: 0.2,
    depth: 1,
    offsetLeft: 0.25,
    offsetGround: 0.5,
};

export const SmallSideW2: IWallSettings = {
    width: wallWidth,
    height: wallHeight,
    depth: wallDepth,
    material: wallMaterial,
    doors: undefined,
    windows: [windowSettings1, windowSettings2],
    stairs: undefined,
    position: {
        x: 0,
        y: 0,
        z: 0
    }
}