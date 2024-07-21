import * as THREE from "three";
import { floorMaterial, normalMaterial, wallMaterial } from "../materials";
import { IBalconySettings, IDoorSettings, IStairsSettings, IWallSettings } from "./baseShapes";

const wallWidth = 4;
const wallHeight = 5;
const wallDepth = 0.25;

export const RoofBoxWallPlain: IWallSettings = {
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