import * as THREE from "three";
import { floorMaterial, normalMaterial, wallMaterial } from "../materials";
import { IBalconySettings, IDoorSettings, IStairsSettings, IWallSettings } from "./baseShapes";

const wallWidth = 10;
const wallHeight = 6;
const wallDepth = 0.25;


const doorSettings1 : IDoorSettings = {
    width: 0.5,
    height: 0.6,
    depth: 1,
    offsetLeft: 0.4,
    offsetGround: 0,
    balcony: undefined,
};

export const LargeSideGarage: IWallSettings = {
    width: wallWidth,
    height: wallHeight,
    depth: wallDepth,
    material: wallMaterial,
    doors: [doorSettings1],
    windows: undefined,
    stairs: undefined,
    position: {
        x: 0,
        y: 0,
        z: 0
    }
}