//function to add a floor
import * as THREE from 'three';

import { colors, 
    groundMaterial, 
    floorMaterial, 
    roofMaterial, 
    windowMaterial, 
    wallMaterial, 
    woodMaterial, 
    normalMaterial, 
    standartMaterial, 
    lambert, 
    phongMaterial 
} from './materials';

import { IHoleSettings, IWallSettings } from './shapes/baseShapes';
import { CSG } from 'three-csg-ts';

function addWallWithDoorAndWindow(
    wallSettings: IWallSettings, 
    doorSettings?: IHoleSettings | null, 
    windowSettings?: IHoleSettings | null
): THREE.Mesh {
    // Create wall mesh
    const wallGeo = new THREE.BoxGeometry(wallSettings.width, wallSettings.height, wallSettings.depth);
    const wallMesh = new THREE.Mesh(wallGeo, wallSettings.material);
    wallMesh.position.set(wallSettings.position.x || 0, wallSettings.position.y, wallSettings.position.z || 0);
    if (doorSettings === undefined && windowSettings === undefined) {
        return wallMesh;
    }
    // Create window geometry and mesh
    const windowGeo = new THREE.BoxGeometry(windowSettings.width, windowSettings.height, wallSettings.depth);
    const windowMesh = new THREE.Mesh(windowGeo, windowMaterial);

    // Create door geometry and mesh
    const doorGeo = new THREE.BoxGeometry(doorSettings.width, doorSettings.height, wallSettings.depth);
    const doorMesh = new THREE.Mesh(doorGeo, windowMaterial);

    // Calculate offsets as ratios of the wall's width
    const doorOffsetX = doorSettings.offsetLeft * wallSettings.width; // Adjusted to use ratio
    const windowOffsetX = windowSettings.offsetLeft * wallSettings.width; // Adjusted to use ratio

    // Calculate and apply transformations for door and window using the new offsets
    let doorMatrix = new THREE.Matrix4();
    doorMatrix.makeTranslation(doorOffsetX, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + doorSettings.height / 2, 0);

    let windowMatrix = new THREE.Matrix4();
    windowMatrix.makeTranslation(windowOffsetX, wallMesh.position.y - wallMesh.geometry.parameters.height / 2 + windowSettings.top, 0);

    doorMesh.applyMatrix4(doorMatrix);
    windowMesh.applyMatrix4(windowMatrix);

    // Perform CSG operations
    const wallCSG = CSG.fromMesh(wallMesh);
    const doorCSG = CSG.fromMesh(doorMesh);
    const windowCSG = CSG.fromMesh(windowMesh);

    const wallWithDoor = wallCSG.subtract(doorCSG);
    const wallWithDoorAndWindow = wallWithDoor.subtract(windowCSG);

    // Convert CSG back to THREE.Mesh, apply material, and adjust position
    const resultMesh = wallWithDoorAndWindow.toMesh(new THREE.Matrix4());
    resultMesh.material = wallSettings.material;
    resultMesh.position.set(wallMesh.position.x, wallMesh.position.y, wallMesh.position.z);

    // Clean up: Remove the original wall mesh from the scene if added
    // scene.remove(wallMesh);

    // Add the final mesh to the scene
    // scene.add(resultMesh);

    return resultMesh;
}

function addHoleOnWallCSG(
    wallCSG: any, 
    holes: any[], 
    wallSettings: IWallSettings, 
    material: THREE.Material, 
    baseYPosition: number, 
    heightOffsetFunction: (hole: any) => number
): any {
    holes.forEach(hole => {
        let holeMesh = new THREE.Mesh(new THREE.BoxGeometry(hole.width, hole.height, wallSettings.depth), material);
        const holeOffsetX = hole.offsetLeft * wallSettings.width;
        let holeMatrix = new THREE.Matrix4();
        holeMatrix.makeTranslation(holeOffsetX, baseYPosition + heightOffsetFunction(hole), 0);
        holeMesh.applyMatrix4(holeMatrix);
        let holeCSG = CSG.fromMesh(holeMesh);
        wallCSG = wallCSG.subtract(holeCSG);
    });
    return wallCSG;
}



function addWallWithHoles(wallSettings: IWallSettings) {
    let wallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallSettings.width, wallSettings.height, wallSettings.depth), wallSettings.material);
    let wallCSG = CSG.fromMesh(wallMesh);

    // baseYPosition is the base of the wall
    const baseYPosition = wallMesh.position.y - wallMesh.geometry.parameters.height / 2;

    // Subtract doors
    if (wallSettings.doors) {
        wallCSG = addHoleOnWallCSG(wallCSG, wallSettings.doors, wallSettings, windowMaterial, baseYPosition, door => door.height / 2); 
    }

    // Subtract windows
    if (wallSettings.windows) {
        wallCSG = addHoleOnWallCSG(wallCSG, wallSettings.windows, wallSettings, windowMaterial, baseYPosition, window => window.top);
    }

    // Add balcony
    // if (wallSettings.balcony) {
    //     const balcony = wallSettings.balcony;
    //     let balconyMesh = new THREE.Mesh(new THREE.BoxGeometry(balcony.width, balcony.height, balcony.depth), balcony.material);
    
    //     // Assuming the balcony is positioned relative to a specific door
    //     const door = wallSettings.doors ? wallSettings.doors[balcony.positionRelativeToDoor] : undefined;
    //     if (door) {
    //         const doorCenterX = door.offsetLeft + door.width / 2;
    //         // Adjust the balcony's x position to be centered over the door
    //         const balconyOffsetX = doorCenterX;
    //         let balconyMatrix = new THREE.Matrix4();
    //         balconyMatrix.makeTranslation(balconyOffsetX, baseYPosition, 0);
    //         balconyMesh.applyMatrix4(balconyMatrix);
    //     }
    
    //     let balconyCSG = CSG.fromMesh(balconyMesh);
    //     wallCSG = wallCSG.union(balconyCSG);
    // }

    let resultMesh = wallCSG.toMesh(new THREE.Matrix4());
    resultMesh.material = wallSettings.material;
    return resultMesh;
}


function addFloorCustom(
    frontWallSettings: IWallSettings, 
    leftWallSettings: IWallSettings, 
    rightWallSettings: IWallSettings, 
    backWallSettings: IWallSettings, 
    material: THREE.Material
): THREE.Group {

    // create 4 walls with settings
    const leftWall = addWallWithHoles(leftWallSettings);
    const frontWall = addWallWithHoles(frontWallSettings);
    // create the right wall object with same settings as left wall but no door or window
    const rightWall = addWallWithHoles(rightWallSettings);
    // create the back wall object with same settings as front wall but no door or window
    const backWall = addWallWithHoles(backWallSettings);

    // Position the walls
    // left wall
    leftWall.position.x = frontWall.position.x - (frontWallSettings.width / 2) + (leftWallSettings.depth / 2); 
    leftWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
    leftWall.position.z = frontWall.position.z + (frontWallSettings.depth / 2) - (leftWallSettings.width / 2); // Align with frontWall on the z-axis
    leftWall.rotation.y = -Math.PI / 2; // Rotate 90 degrees to make the angle
    // right wall opposite of left wall
    rightWall.position.x = leftWall.position.x + frontWallSettings.width;
    rightWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
    rightWall.position.z = leftWall.position.z; // Align with leftWall on the z-axis
    rightWall.rotation.y = Math.PI / 2; // Rotate to face the opposite direction
    // back wall opposite of front wall
    backWall.position.x = frontWall.position.x;
    backWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
    backWall.position.z = frontWall.position.z - leftWallSettings.width + frontWallSettings.depth; // Align with frontwall on the z-axis

    // add a floor ground plane if needed
    const floorGeometry = new THREE.BoxGeometry(frontWallSettings.width + leftWallSettings.depth, 0.1, leftWallSettings.width); // depth is wallSettings1.width, width is wallSettings2.width, height is very thin (0.1)
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

    // Position the floor
    // Assuming wallMesh1.position.y is the base of the walls, adjust if necessary
    floorMesh.position.x = frontWall.position.x + (leftWallSettings.depth / 2); // Centered between wall2 and wall4
    floorMesh.position.y = frontWall.position.y - (frontWallSettings.height / 2); // Just below the walls, adjust if your wallMesh1.position.y is not the base
    floorMesh.position.z = leftWall.position.z; // Centered between wall1 and wall3

    // Group and return all elements
    const floorGroup = new THREE.Group();
    floorGroup.add(frontWall);
    floorGroup.add(leftWall);
    floorGroup.add(rightWall);
    floorGroup.add(backWall);
    // Add the floorMesh to the group after creating it as before
    floorGroup.add(floorMesh);

    return floorGroup;
}

export {
    addWallWithDoorAndWindow,
    addHoleOnWallCSG,
    addWallWithHoles,
    addFloorCustom
};