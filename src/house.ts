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

import { IHoleSettings, IWallSettings, IStairsSettings, IDoorSettings } from './shapes/baseShapes';
import { CSG } from 'three-csg-ts';
import { Evaluator, Operation, SUBTRACTION } from 'three-bvh-csg';

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
    wallMesh: any, 
    holes: any[], 
    wallSettings: IWallSettings, 
    material: THREE.Material, 
    baseYPosition: number, 
    heightOffsetFunction: (hole: any) => number
): any {
    let wallCSG = CSG.fromMesh(wallMesh);
    holes.forEach(hole => {
        let holeWidth = hole.width * wallSettings.width;
        let holeHeight = hole.height * wallSettings.height;
        let holeDepth = wallSettings.depth * 1.1;

        let holeX = wallMesh.position.x - wallSettings.width / 2 + hole.offsetLeft * wallSettings.width;
        let holeY = wallMesh.position.y - wallSettings.height / 2 + holeHeight / 2;
        let holeZ = wallMesh.position.z;

        let holeMesh = new THREE.Mesh(new THREE.BoxGeometry(holeWidth, holeHeight, holeDepth), material);
        let holeMatrix = new THREE.Matrix4();
        holeMatrix.makeTranslation(holeX, holeY, holeZ);
        holeMesh.applyMatrix4(holeMatrix);
        let holeCSG = CSG.fromMesh(holeMesh);
        
        wallCSG = wallCSG.subtract(holeCSG);
    });
    return wallCSG.toMesh(new THREE.Matrix4());
}

// CSG
let csgEvaluator: any;
csgEvaluator = new Evaluator();
csgEvaluator.attributes = ["position", "normal"];
csgEvaluator.useGroups = false;

interface IFrame {
    x?: number;
    y?: number;
    z?: number;
    width?: number;
    height?: number;
    depth?: number;
    framewidth?: number[];
}
const frame = ({
    width = 2,
    height = 2,
    framewidth = [0.05, 0.05, 0.05, 0.05],
    depth = 5,
  }: IFrame) => {
    const frame = new Operation(new THREE.BoxGeometry(width, height, depth));
  
    const hole = new Operation(
      new THREE.BoxGeometry(
        width - framewidth[1] - framewidth[3],
        height - framewidth[0] - framewidth[2],
        depth * 2
      )
    );
    hole.operation = SUBTRACTION;
    hole.position.y = (framewidth[2] - framewidth[0]) / 2;
    hole.position.x = (framewidth[3] - framewidth[1]) / 2;
  
    frame.add(hole);
  
    const result = csgEvaluator.evaluateHierarchy(frame);
    result.castShadow = true;
    result.receiveShadow = true;
  
    return result;
};


function addWallWithHoles(wallSettings: IWallSettings) {
    let wallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallSettings.width, wallSettings.height, wallSettings.depth), wallSettings.material);

    // baseYPosition is the base of the wall
    const baseYPosition = wallMesh.position.y - wallMesh.geometry.parameters.height / 2;

    // Subtract door holes
    if (wallSettings.doors) {
        wallMesh = addHoleOnWallCSG(wallMesh, wallSettings.doors, wallSettings, windowMaterial, baseYPosition, door => door.height / 2); 
    }

    // Subtract window holes
    if (wallSettings.windows) {
        wallMesh = addHoleOnWallCSG(wallMesh, wallSettings.windows, wallSettings, windowMaterial, baseYPosition, window => window.top);
    }

    let resultMesh = wallMesh;
    resultMesh.material = wallSettings.material;

    // add door parts
    if (wallSettings.doors) {
        wallSettings.doors.forEach(door => {
            let doorWidth = door.width * wallSettings.width;
            let doorHeight = door.height * wallSettings.height;
            let doorDepth = wallSettings.depth * 1.1;
            let holeX = wallMesh.position.x - wallSettings.width / 2 + door.offsetLeft * wallSettings.width;
            let holeY = wallMesh.position.y - wallSettings.height / 2 + doorHeight / 2;
            let holeZ = wallMesh.position.z;

            // add door frame
            let doorMatrix = new THREE.Matrix4();
            doorMatrix.makeTranslation(holeX, holeY, holeZ);
            let doorFrame = frame({ width: doorWidth, height: doorHeight, depth: wallSettings.depth });
            doorFrame.applyMatrix4(doorMatrix);
            resultMesh.add(doorFrame);

            // add door 


            // add balcony
            if (door.balcony) {
                const balconySettings = door.balcony;
                let balconyWidth = balconySettings.width;
                let balconyHeight = balconySettings.height;
                let balconyDepth = balconySettings.depth;
                let balconyX = holeX; // Adjust based on your balcony positioning logic
                let balconyY = wallMesh.position.y - wallSettings.height / 2 + balconyHeight / 2; // Adjust based on your balcony positioning logic
                let balconyZ = wallMesh.position.z + wallSettings.depth / 2 + balconyDepth / 2; // Adjust for balcony to protrude

                // Adjust the balcony width if it is full length
                if(balconySettings.isFullLength) {
                    balconyWidth = wallSettings.width;
                    balconyX = wallMesh.position.x;
                }
                
                const balconyMesh = new THREE.Mesh(new THREE.BoxGeometry(balconyWidth, balconyHeight, balconyDepth), balconySettings.material);
                balconyMesh.position.set(balconyX, balconyY, balconyZ);
            
                // Add the balcony mesh to the group
                resultMesh.add(balconyMesh);
            }
        });
    }


    let wallGroup = new THREE.Group();
    wallGroup.add(resultMesh); // Add the wall mesh to the group



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
    hasInsideStairs: boolean,
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

    
    // Group and return all elements
    const floorGroup = new THREE.Group();
    floorGroup.add(frontWall);
    floorGroup.add(leftWall);
    floorGroup.add(rightWall);
    floorGroup.add(backWall);
    // Add the floorMesh to the group after creating it as before
    floorGroup.add(floorMesh);
    // inside stair
    if (hasInsideStairs) {
        // Add a staircase starting at the top of the floor mesh inside the floor
        const inStair = createStairs(stairSettings); // Example: 10 steps, each 1 unit wide, 0.5 units high, 0.5 units deep
        // Position the staircase at the top of the floor mesh
        // Assuming the staircase starts at the start of the backwall of the floor
        inStair.rotateY(-Math.PI / 2); // Rotate the staircase to face the opposite direction
        inStair.position.x = floorMesh.position.x - (stairSettings.stepDepth * stairSettings.steps) + 1.5 * leftWallSettings.depth + 1; // Adjust based on the total width of the staircase
        inStair.position.y = floorMesh.position.y + 0.05; // Slightly above the floor to avoid z-fighting
        // Correct calculation for the staircase's Z position to be centered and flush against the back wall
        inStair.position.z = backWall.position.z + backWallSettings.depth /2 + stairSettings.stepWidth / 2; // Adjust based on the total depth of the staircase

        // Add the staircase to the group
        floorGroup.add(inStair);
    }


    return floorGroup;
}

// function addRoofTop(
//     frontWallSettings: IWallSettings, 
//     leftWallSettings: IWallSettings, 
//     rightWallSettings: IWallSettings, 
//     backWallSettings: IWallSettings, 
//     material: THREE.Material
// ): THREE.Group {
//     const floorThickness = 0.1; // Thickness of the floor
//     // ajust the settings
//     frontWallSettings.height = 1;
//     leftWallSettings.height = 1;
//     rightWallSettings.height = 1;
//     backWallSettings.height = 1;
//     frontWallSettings.balcony = undefined;
//     frontWallSettings.stairs = undefined;
//     frontWallSettings.doors = undefined;
//     rightWallSettings.balcony = undefined;
//     rightWallSettings.stairs = undefined;
//     // create 4 walls with settings
//     const leftWall = addWallWithHoles(leftWallSettings);
//     const frontWall = addWallWithHoles(frontWallSettings);
//     // create the right wall object with same settings as left wall but no door or window
//     const rightWall = addWallWithHoles(rightWallSettings);
//     // create the back wall object with same settings as front wall but no door or window
//     const backWall = addWallWithHoles(backWallSettings);

    
//     const floorGroup = new THREE.Group();

//     // Position the walls
//     // left wall
//     leftWall.position.x = frontWall.position.x - (frontWallSettings.width / 2) + (leftWallSettings.depth / 2); 
//     leftWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
//     leftWall.position.z = frontWall.position.z + (frontWallSettings.depth / 2) - (leftWallSettings.width / 2); // Align with frontWall on the z-axis
//     leftWall.rotation.y = -Math.PI / 2; // Rotate 90 degrees to make the angle
//     // right wall opposite of left wall
//     rightWall.position.x = leftWall.position.x + frontWallSettings.width;
//     rightWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
//     rightWall.position.z = leftWall.position.z; // Align with leftWall on the z-axis
//     rightWall.rotation.y = Math.PI / 2; // Rotate to face the opposite direction
//     // back wall opposite of front wall
//     backWall.position.x = frontWall.position.x;
//     backWall.position.y = frontWall.position.y; // Align with frontWall on the y-axis
//     backWall.position.z = frontWall.position.z - leftWallSettings.width + frontWallSettings.depth; // Align with frontwall on the z-axis

//     // add a floor ground plane if needed
//     const floorGeometry = new THREE.BoxGeometry(frontWallSettings.width + leftWallSettings.depth, floorThickness, leftWallSettings.width); // depth is wallSettings1.width, width is wallSettings2.width, height is very thin (0.1)
//     const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

//     // Position the floor
//     // Assuming wallMesh1.position.y is the base of the walls, adjust if necessary
//     floorMesh.position.x = frontWall.position.x + (leftWallSettings.depth / 2); // Centered between wall2 and wall4
//     floorMesh.position.y = frontWall.position.y - (frontWallSettings.height / 2); // Just below the walls, adjust if your wallMesh1.position.y is not the base
//     floorMesh.position.z = leftWall.position.z; // Centered between wall1 and wall3


//     const doorSettings2: IHoleSettings = {
//         width: 1.5,
//         height: 3,
//         offsetLeft: -0.1,
//     }

//     const boxWallLeftSettings: IWallSettings = {
//         width: 4,
//         height: 5,
//         depth: leftWallSettings.depth,
//         material: material,
//         doors: [doorSettings2],
//         windows: undefined,
//         balcony: undefined,
//         stairs: undefined,
//         position: {
//             x: leftWall.position.x,
//             y: leftWall.position.y,
//             z: leftWall.position.z
//         }
//     };
//     const boxWallNoDoorSettings: IWallSettings = {
//         width: 4,
//         height: 5,
//         depth: leftWallSettings.depth,
//         material: material,
//         doors: undefined,
//         windows: undefined,
//         balcony: undefined,
//         stairs: undefined,
//         position: {
//             x: leftWall.position.x,
//             y: leftWall.position.y,
//             z: leftWall.position.z
//         }
//     };

//     // phan nho len, chua biet dat ten gi
//     const newFloor = addFloorCustom(boxWallNoDoorSettings, boxWallLeftSettings, boxWallNoDoorSettings, boxWallNoDoorSettings, false, wallMaterial);
//     newFloor.position.y = floorMesh.position.y + floorThickness + boxWallLeftSettings.height / 2;

//     floorGroup.add(frontWall);
//     floorGroup.add(leftWall);
//     floorGroup.add(rightWall);
//     floorGroup.add(backWall);
//     // Add the floorMesh to the group after creating it as before
//     floorGroup.add(floorMesh);
//     floorGroup.add(newFloor);

//     return floorGroup;
// }

function addRoofTop(
    frontWallSettingsInput: IWallSettings, 
    leftWallSettingsInput: IWallSettings, 
    rightWallSettingsInput: IWallSettings, 
    backWallSettingsInput: IWallSettings, 
    material: THREE.Material
): THREE.Group {
    const floorThickness = 0.1; // Thickness of the floor

    // Clone and adjust the settings to avoid modifying the original settings
    const frontWallSettings = { ...frontWallSettingsInput, height: 1, balcony: undefined, stairs: undefined, doors: undefined };
    const leftWallSettings = { ...leftWallSettingsInput, height: 1, balcony: undefined, stairs: undefined, doors: undefined };
    const rightWallSettings = { ...rightWallSettingsInput, height: 1, balcony: undefined, stairs: undefined, doors: undefined };
    const backWallSettings = { ...backWallSettingsInput, height: 1, balcony: undefined, stairs: undefined, doors: undefined };

    // Create walls with adjusted settings
    const leftWall = addWallWithHoles(leftWallSettings);
    const frontWall = addWallWithHoles(frontWallSettings);
    const rightWall = addWallWithHoles(rightWallSettings);
    const backWall = addWallWithHoles(backWallSettings);

    const floorGroup = new THREE.Group();

    // Position the walls correctly based on your scene's coordinate system
    // Adjust the positioning logic as needed

    // Add a floor ground plane
    const floorGeometry = new THREE.BoxGeometry(frontWallSettings.width + leftWallSettings.depth, floorThickness, leftWallSettings.width);
    const floorMesh = new THREE.Mesh(floorGeometry, material); // Use the provided material for the floor

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

    // Position the floor
    // Assuming wallMesh1.position.y is the base of the walls, adjust if necessary
    floorMesh.position.x = frontWall.position.x + (leftWallSettings.depth / 2); // Centered between wall2 and wall4
    floorMesh.position.y = frontWall.position.y - (frontWallSettings.height / 2); // Just below the walls, adjust if your wallMesh1.position.y is not the base
    floorMesh.position.z = leftWall.position.z; // Centered between wall1 and wall3

    // Example positioning logic (adjust as necessary)
    floorMesh.position.set(frontWall.position.x + (leftWallSettings.depth / 2), frontWall.position.y - (frontWallSettings.height / 2), leftWall.position.z);

    // Additional structure on top (adjust as necessary)
    const roofDoorSettings1 : IDoorSettings = {
        width: 0.25,
        height: 0.6,
        depth: 1,
        offsetLeft: 0.2,
        offsetGround: 0,
        balcony: undefined,
    };
    const boxWallLeftSettings = { ...leftWallSettings, width: 4, height: 5, doors: [roofDoorSettings1], windows: undefined };
    const boxWallNoDoorSettings = { ...boxWallLeftSettings, doors: undefined };

    const newFloor = addFloorCustom(boxWallNoDoorSettings, boxWallLeftSettings, boxWallNoDoorSettings, boxWallNoDoorSettings, false, material);
    newFloor.position.y = floorMesh.position.y + floorThickness + boxWallLeftSettings.height / 2 + 0.01;

    // Add all elements to the group
    floorGroup.add(frontWall, leftWall, rightWall, backWall, floorMesh, newFloor);

    return floorGroup;
}

export {
    addWallWithDoorAndWindow,
    addHoleOnWallCSG,
    addWallWithHoles,
    addFloorCustom,
    createStairs,
    addRoofTop
};