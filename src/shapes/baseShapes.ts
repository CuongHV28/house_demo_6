
import * as THREE from 'three';
import { Operation, SUBTRACTION } from 'three-bvh-csg';

export interface IWallSettings {
    width: number;
    height: number;
    depth: number;
    material: THREE.Material;
    doors?: IDoorSettings[];
    windows?: IWindowSettings[];
    stairs?: IStairsSettings;
    position: {
        x?: number;
        y: number;
        z?: number;
    };
    rotation?: {
        x?: number;
        y?: number;
        z?: number;
    };
}


export interface IHoleSettings {
    width: number;  // width of the hole as a percentage of the wall width
    height: number; // height of the hole as a percentage of the wall height
    depth: number;  // depth of the hole
    offsetLeft: number; // offset of the hole from the left side of the wall as a percentage of the wall width
    offsetGround: number; // offset of the hole from the bottom side of the wall as a percentage of the wall height
}
export interface IDoorSettings extends IHoleSettings {
    balcony?: IBalconySettings;
}

export interface IWindowSettings extends IHoleSettings {

}

export interface IBalconySettings {
    // Define the properties of the 'IBalconySettings' interface here
    width: number;  // width of the balcony, if it is full length of the wall, it is the same as the wall width
    height: number;
    depth: number;
    isFullLength: boolean;  // if the balcony is full length of the wall
    material: THREE.Material;
}


export interface IStairsSettings {
    steps: number,
    stepWidth: number,
    stepHeight: number,
    stepDepth: number,
    material: THREE.Material;
    position: {
        x?: number;
        y: number;
        z?: number;
    };
    rotation?: {
        x?: number;
        y?: number;
        z?: number;
    };
}
