import * as THREE from "three";
import { floorMaterial, normalMaterial, wallMaterial } from "../materials";
import { IBalconySettings, IDoorSettings, IStairsSettings, IWallSettings } from "./baseShapes";

const wallWidth = 4;
const wallHeight = 5;
const wallDepth = 0.25;

const doorSettings : IDoorSettings = {
    width: 0.3,
    height: 0.6,
    depth: 1,
    offsetLeft: 0.6,
    offsetGround: 0,
    balcony: undefined,
};

export const RoofBoxWallD1: IWallSettings = {
    width: wallWidth,
    height: wallHeight,
    depth: wallDepth,
    material: wallMaterial,
    doors: [doorSettings],
    windows: undefined,
    stairs: undefined,
    position: {
        x: 0,
        y: 0,
        z: 0
    }
}