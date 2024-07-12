import * as THREE from 'three';
import { IHoleSettings } from '../shapes/baseShapes';

export interface IHouseSide {
    start?: THREE.Vector3;
    end?: THREE.Vector3;
    shift?: THREE.Vector3;
    width?: number;
    angle?: number;
    combinedAngle?: number;
    holes?: IHoleSettings[];
}


