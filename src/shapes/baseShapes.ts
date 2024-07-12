
import * as THREE from 'three';
import { Operation, SUBTRACTION } from 'three-bvh-csg';

export interface IWallSettings {
    width: number;
    height: number;
    depth: number;
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

export interface IHoleSettings {
    width: number;
    height?: number;
    x?: number;
    y?: number;
    groundY?: number;
    top?: number;
    bottom?: number;
    left?: number;
    offsetLeft?: number;
    shapes?: any[];
}

export function wallHole(w: number, h: number, x: number, y: number) {
    const hole = new Operation(new THREE.BoxGeometry(w, h, 0.7)); //BoxBufferGeometry
    hole.operation = SUBTRACTION; //ADDITION; // ;
    hole.position.x = x;
    hole.position.y = y; //hole.positionFromGround(y);

    hole.matrixAutoUpdate = false;
    hole.updateMatrix();
    // console.log(w, h, x, y);

    //addWindow(w, h, x, y);

    return hole;
}