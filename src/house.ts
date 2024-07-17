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

import { IHoleSettings, IWallSettings, IStairsSettings } from './shapes/baseShapes';
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

    let resultMesh = wallCSG.toMesh(new THREE.Matrix4());
    resultMesh.material = wallSettings.material;

    let wallGroup = new THREE.Group();
    wallGroup.add(resultMesh); // Add the wall mesh to the group

    // Add balcony
    if (wallSettings.balcony) {
        const balcony = wallSettings.balcony;
        let balconyMesh = new THREE.Mesh(new THREE.BoxGeometry(balcony.width, balcony.height, balcony.depth), balcony.material);
    
        // Assuming the balcony is positioned relative to a specific door
        const door = wallSettings.doors ? wallSettings.doors[balcony.positionRelativeToDoor] : undefined;
        if (door) {
            // Calculate the door's center x position relative to the wall's center
            // const doorCenterX = (door.offsetLeft + door.width / 2) * wallSettings.width - wallSettings.width / 2;
            const doorCenterX = door.offsetLeft * wallSettings.width + door.width / 2 - (door.offsetLeft + 0.5) * wallSettings.balcony.width;
            // Use doorCenterX for the balcony's x position to align it with the door
            const balconyOffsetX = doorCenterX;
            // Calculate the y position based on the balcony's height and the wall's height
            const balconyOffsetY = baseYPosition + (balcony.height / 2);
            // Assuming the balcony depth positions it correctly in relation to the wall's depth
            const balconyOffsetZ = wallSettings.depth / 2 + balcony.depth / 2;
    
            // Apply the calculated positions
            balconyMesh.position.set(balconyOffsetX, balconyOffsetY, balconyOffsetZ);
        }
    
        // Add the balcony mesh to the group
        wallGroup.add(balconyMesh);
    }

    // Add stairs
    if (wallSettings.stairs) {
        const outStair = createStairs(wallSettings.stairs); // Assuming stairSettings is defined
        outStair.rotateY(-Math.PI / 2); // Rotate the staircase to face the desired direction
        // Position the staircase outside the wall
        outStair.position.x = wallMesh.position.x - (wallSettings.stairs.stepDepth * wallSettings.stairs.steps) + 1.5 * wallSettings.depth + 4;
        outStair.position.y = wallMesh.position.y - wallSettings.height / 2 + 0.05; // Slightly above the floor to avoid z-fighting
        outStair.position.z = wallMesh.position.z + wallSettings.depth / 2 + wallSettings.stairs.stepWidth / 2;

        // Create a group and add both the wall and the staircase
        wallGroup.add(outStair); // Add the staircase to the group
    }

    // Return the group instead of individual meshes
    return wallGroup;
}

function createStairs(settings : IStairsSettings) {
    const stairs = new THREE.Group(); // Create a group to hold all the steps
    // const stepMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 }); // Green steps
  
    for (let i = 0; i < settings.steps; i++) {
        const stepGeometry = new THREE.BoxGeometry(settings.stepWidth, settings.stepHeight, settings.stepDepth);
        const stepMesh = new THREE.Mesh(stepGeometry, settings.material);
  
        // Position each step
        stepMesh.position.x = 0; // Centered on X
        stepMesh.position.y = settings.stepHeight / 2 + i * settings.stepHeight; // Stacked on Y
        stepMesh.position.z = -i * settings.stepDepth; // Staggered on Z
  
        stairs.add(stepMesh); // Add step to the group
    }
  
    return stairs; // Return the group containing all steps
}


function addFloorCustom(
    frontWallSettings: IWallSettings, 
    leftWallSettings: IWallSettings, 
    rightWallSettings: IWallSettings, 
    backWallSettings: IWallSettings, 
    material: THREE.Material
): THREE.Group {
    
    // assume settings are defined
    const floorThickness = 0.1; // Thickness of the floor
    //stairs settings
    const steps = 10;
    const stepWidth = 1;
    const stepHeight = (frontWallSettings.height - floorThickness) / steps;
    const stairSettings: IStairsSettings = {
        steps: steps,
        stepWidth: stepWidth,
        stepHeight: stepHeight,
        stepDepth: 0.5,
        material: new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
        position: {
            x: 0,
            y: 0,
            z: 0
        }
    };
    frontWallSettings.stairs = stairSettings;
    rightWallSettings.stairs = stairSettings;

    // create 4 walls with settings
    const leftWall = addWallWithHoles(leftWallSettings);
    const frontWall = addWallWithHoles(frontWallSettings);
    // create the right wall object with same settings as left wall but no door or window
    const rightWall = addWallWithHoles(rightWallSettings);
    // create the back wall object with same settings as front wall but no door or window
    const backWall = addWallWithHoles(backWallSettings);

    frontWall.name = 'frontWall';
    leftWall.name = 'leftWall';
    rightWall.name = 'rightWall';
    backWall.name = 'backWall';

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
    const floorGeometry = new THREE.BoxGeometry(frontWallSettings.width + leftWallSettings.depth, floorThickness, leftWallSettings.width); // depth is wallSettings1.width, width is wallSettings2.width, height is very thin (0.1)
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

    // Position the floor
    // Assuming wallMesh1.position.y is the base of the walls, adjust if necessary
    floorMesh.position.x = frontWall.position.x + (leftWallSettings.depth / 2); // Centered between wall2 and wall4
    floorMesh.position.y = frontWall.position.y - (frontWallSettings.height / 2); // Just below the walls, adjust if your wallMesh1.position.y is not the base
    floorMesh.position.z = leftWall.position.z; // Centered between wall1 and wall3

    
    // inside stair
    // Add a staircase starting at the top of the floor mesh inside the floor
    const inStair = createStairs(stairSettings); // Example: 10 steps, each 1 unit wide, 0.5 units high, 0.5 units deep
    // Position the staircase at the top of the floor mesh
    // Assuming the staircase starts at the start of the backwall of the floor
    inStair.rotateY(-Math.PI / 2); // Rotate the staircase to face the opposite direction
    inStair.position.x = floorMesh.position.x - (stairSettings.stepDepth * stairSettings.steps) + 1.5 * leftWallSettings.depth + 1; // Adjust based on the total width of the staircase
    inStair.position.y = floorMesh.position.y + 0.05; // Slightly above the floor to avoid z-fighting
    // Correct calculation for the staircase's Z position to be centered and flush against the back wall
    inStair.position.z = backWall.position.z + backWallSettings.depth /2 + stairSettings.stepWidth / 2; // Adjust based on the total depth of the staircase

    

    // Group and return all elements
    const floorGroup = new THREE.Group();
    floorGroup.add(frontWall);
    floorGroup.add(leftWall);
    floorGroup.add(rightWall);
    floorGroup.add(backWall);
    // Add the floorMesh to the group after creating it as before
    floorGroup.add(floorMesh);
    // Add the staircase to the group
    floorGroup.add(inStair);

    return floorGroup;
}

export {
    addWallWithDoorAndWindow,
    addHoleOnWallCSG,
    addWallWithHoles,
    addFloorCustom,
    createStairs
};