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
import { ADDITION, Evaluator, Operation, SUBTRACTION } from 'three-bvh-csg';

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
    material: THREE.Material
): any {
    let wallCSG = CSG.fromMesh(wallMesh);
    holes.forEach(hole => {
        let holeWidth = hole.width * wallSettings.width;
        let holeHeight = hole.height * wallSettings.height;
        let holeDepth = wallSettings.depth * 1.1;

        let holeX = wallMesh.position.x - wallSettings.width / 2 + hole.offsetLeft * wallSettings.width;
        let holeY = wallMesh.position.y - wallSettings.height / 2 + holeHeight / 2 + hole.offsetGround * wallSettings.height;
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

// door and window frame
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

// balcony railing
export interface IBalconyMaterials {
    default: any;
    alu?: any;
    fabric?: any[];
}

interface IBalconyRailing {
    materials: IBalconyMaterials;
    width?: number;
    height?: number;
    space?: number;
    railwidth?: number;
}
export const balconyRaling = ({
    height = 1,
    width = 2,
    space = 0.1,
    railwidth = 0.06,
    materials
}: IBalconyRailing) => {
    const g = new THREE.Group();
    
    const count = Math.round(width / space);
    space = width / count;
    
    const toprail = new THREE.Mesh(
        new THREE.BoxGeometry(width + railwidth, railwidth, railwidth),
        materials.alu || materials.default
    );
    toprail.position.x = width / 2;
    toprail.position.y = height;
    toprail.position.z = 0;
    toprail.receiveShadow = true;
    toprail.castShadow = true;
    g.add(toprail);
    toprail.matrixAutoUpdate = false;
    toprail.updateMatrix();
    
    for (var i = 0; i <= count; i++) {
        const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, height, 0.02),
        materials.alu || materials.default
    );
        rail.position.x = i * space;
        rail.position.y = height / 2;
        rail.position.z = 0;
        rail.receiveShadow = true;
        rail.castShadow = true;
        g.add(rail);
        rail.matrixAutoUpdate = false;
        rail.updateMatrix();
    }

    return g;
};


// shutters
interface IAweningMaterials {
    // Define the properties of IAweningMaterials here
}

interface IShutter {
    materials: IAweningMaterials;
    x?: number;
    y?: number;
    z?: number;
    width?: number;
    height?: number;
}
const shutter = ({ width = 2, height = 2, materials }: IShutter) => {
    const framemesh = frame({
        width: width,
        height: height,
        framewidth: [0.05, 0.05, 0.05, 0.05],
        depth: 0.04,
    });
    const shutterframe = new Operation(framemesh.geometry);
  
    const innerheight = height - 0.05 - 0.05;
    const innerwidth = width - 0.05 - 0.05;
    const shutterparts = Math.ceil(innerheight / 0.1 + 0.005);
    const shutterPartHeight = 0.1;
    const spacingBetweenParts = 0.005;
  
    const originalshutterpart = new Operation(
        new THREE.BoxGeometry(innerwidth, 0.1, 0.02)
    );
    originalshutterpart.operation = ADDITION;
    originalshutterpart.position.x = 0.01;
    originalshutterpart.rotation.x = 2.5;
  
    let shutterY = innerheight / 2 - shutterPartHeight / 2; // Initial Y position for the first shutter part
    for (var i = 0; i < shutterparts; i++) {
        const shutterpart = originalshutterpart.clone();
        shutterpart.position.y = shutterY;
        shutterframe.add(shutterpart);

        shutterframe.matrixAutoUpdate = false;
        shutterframe.updateMatrix();
        shutterY -= (shutterPartHeight + spacingBetweenParts); // Move down for the next part
    }
  
    const result = csgEvaluator.evaluateHierarchy(shutterframe);
    result.castShadow = true;
    result.receiveShadow = true;
    result.material = materials.default;

  
    return result;
};


function addWallWithHoles(wallSettings: IWallSettings) {
    let wallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallSettings.width, wallSettings.height, wallSettings.depth), wallSettings.material);

    // baseYPosition is the base of the wall
    const baseYPosition = wallMesh.position.y - wallMesh.geometry.parameters.height / 2;

    // Subtract door holes
    if (wallSettings.doors) {
        wallMesh = addHoleOnWallCSG(wallMesh, wallSettings.doors, wallSettings, windowMaterial); 
    }

    // Subtract window holes
    if (wallSettings.windows) {
        wallMesh = addHoleOnWallCSG(wallMesh, wallSettings.windows, wallSettings, windowMaterial);
    }

    let resultMesh = wallMesh;
    resultMesh.material = wallSettings.material;

    // add door parts
    if (wallSettings.doors) {
        wallSettings.doors.forEach(door => {
            const doorWidth = door.width * wallSettings.width;
            const doorHeight = door.height * wallSettings.height;
            const doorDepth = wallSettings.depth * 1.1;

            const holeX = wallMesh.position.x - wallSettings.width / 2 + door.offsetLeft * wallSettings.width;
            const holeY = wallMesh.position.y - wallSettings.height / 2 + doorHeight / 2 + door.offsetGround * wallSettings.height;
            const holeZ = wallMesh.position.z;

            // add door frame
            const doorMatrix = new THREE.Matrix4();
            doorMatrix.makeTranslation(holeX, holeY, holeZ);
            const doorFrame = frame({ width: doorWidth, height: doorHeight, depth: wallSettings.depth });
            doorFrame.applyMatrix4(doorMatrix);
            resultMesh.add(doorFrame);

            // add door shutters
            const frameThickness = 0.05;
            const doorSettings = {
                shutters: 1,
                materials: {
                    default: woodMaterial,
                    alu: windowMaterial,
                },
                open: [0, 0],
            };
            const innerWidth = doorWidth - frameThickness * 2;
            const shutterwidth = innerWidth / doorSettings.shutters;
            const shutterheight = doorHeight - frameThickness * 2;
            let doorX = frameThickness;
            const doorGroupRight = new THREE.Group();

            const doorShutter = shutter({
                width: shutterwidth,
                height: shutterheight,
                materials: doorSettings.materials,
            });
            doorShutter.receiveShadow = true;
            // door.position.z = 0;
            doorShutter.castShadow = true;

            let previousGroup;
            let counter = 0;
            for (var i = doorSettings.shutters; i > 0; i--) {
                counter++;
                const isEven = counter % 2 === 1;

                const doorGroup = new THREE.Group();
                let posX = 0;
                if (i !== 1 && previousGroup) {
                const rotatedShutterWidth =
                    shutterwidth * Math.abs(Math.cos(previousGroup.rotation.y));
                    posX = doorX + innerWidth - rotatedShutterWidth * 2;
                }
                if (i === 1) {
                    doorGroup.position.x = doorX;
                } else if (isEven) {
                    doorGroup.position.x = doorX + innerWidth;
                } else {
                    doorGroup.position.x = doorX + innerWidth - i * shutterwidth;
                }

                const doorclone = doorShutter.clone();
                doorGroup.add(doorclone);
                if (i === 1) {
                    doorclone.position.x = holeX;
                } else if (isEven) {
                    doorclone.position.x = holeX - wallSettings.width / 2 + doorWidth / 2;
                } else {
                    doorclone.position.x = holeX - wallSettings.width / 2 + doorWidth / 2;
                }
                doorclone.position.y = holeY;
                doorclone.position.z = holeZ;

                doorclone.matrixAutoUpdate = false;
                doorclone.updateMatrix();

                if (doorSettings.open && doorSettings.open[i] !== null) {
                    if (i === 1) {
                        doorGroup.rotation.y = THREE.MathUtils.degToRad(doorSettings.open[0]);
                    } else if (isEven) {
                        doorGroup.rotation.y = THREE.MathUtils.degToRad(-doorSettings.open[1]);
                    } else {
                        doorGroup.rotation.y = THREE.MathUtils.degToRad(doorSettings.open[1]);
                        doorGroup.position.x = posX;
                    }
                    resultMesh.add(doorGroup);
                }

                previousGroup = doorGroup;
            }
            
            resultMesh.add(doorGroupRight);



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

                // Add railing to the balcony
                // const railingSpace = 0.2;
                // const railingMaterial : IBalconyMaterials = {
                //     default: new THREE.MeshLambertMaterial({ color: 0x00ff00 }), // Green railing
                //     alu: new THREE.MeshLambertMaterial({ color: 0x111111 }) // Dark grey railing
                // }
                // const railingLeft = balconyRaling({
                //     width: balconyDepth * 0.9,
                //     space: railingSpace,
                //     materials: railingMaterial
                // });
                // railingLeft.rotation.y = Math.PI / -2;
                // railingLeft.position.x = balconyX - balconyWidth / 2;
                // railingLeft.position.z = balconyZ - balconyDepth;

                // const railingRight = railingLeft.clone();
                // railingRight.position.x = balconyZ + balconyDepth / 2;

                // const railingFront = balconyRaling({
                //     width: balconyWidth - 0.2,
                //     space: railingSpace,
                //     materials: settings.materials
                // });
                // railingFront.position.x = balconyLeft + 0.1;
                // railingFront.position.z = settings.depth - 0.1;
                // g.add(railingFront);
            
                // Add the balcony mesh to the group
                // balconyMesh.add(railingLeft);
                // balconyMesh.add(railingRight);
                // balconyMesh.add(railingLeft);
                
                resultMesh.add(balconyMesh);
            }
        });
    }

    // add window parts
    if (wallSettings.windows) {
        wallSettings.windows.forEach(window => {
            let windowWidth = window.width * wallSettings.width;
            let windowHeight = window.height * wallSettings.height;
            let windowDepth = wallSettings.depth * 1.1;
            let holeX = wallMesh.position.x - wallSettings.width / 2 + window.offsetLeft * wallSettings.width;
            let holeY = wallMesh.position.y - wallSettings.height / 2 + windowHeight / 2 + window.offsetGround * wallSettings.height;
            let holeZ = wallMesh.position.z;

            // add window frame
            let windowMatrix = new THREE.Matrix4();
            windowMatrix.makeTranslation(holeX, holeY, holeZ);
            let windowFrame = frame({ width: windowWidth, height: windowHeight, depth: wallSettings.depth });
            windowFrame.applyMatrix4(windowMatrix);
            resultMesh.add(windowFrame);
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

function addRoofTop(
    frontWallSettingsInput: IWallSettings, 
    leftWallSettingsInput: IWallSettings, 
    rightWallSettingsInput: IWallSettings, 
    backWallSettingsInput: IWallSettings,
    roofBoxSettings: {
        frontSide: IWallSettings,
        leftSide: IWallSettings,
        rightSide: IWallSettings,
        backSide: IWallSettings,
    },
    material: THREE.Material
): THREE.Group {
    const floorThickness = 0.1; // Thickness of the floor

    // Clone and adjust the settings to avoid modifying the original settings
    const roofFrontWallSettings = { ...frontWallSettingsInput, height: 1, balcony: undefined, stairs: undefined, doors: undefined };
    const roofLeftWallSettings = { ...leftWallSettingsInput, height: 1, balcony: undefined, stairs: undefined, doors: undefined };
    const roofRightWallSettings = { ...rightWallSettingsInput, height: 1, balcony: undefined, stairs: undefined, doors: undefined };
    const roofBackWallSettings = { ...backWallSettingsInput, height: 1, balcony: undefined, stairs: undefined, doors: undefined };

    // Create walls with adjusted settings
    const roofLeftWall = addWallWithHoles(roofLeftWallSettings);
    const roofFrontWall = addWallWithHoles(roofFrontWallSettings);
    const roofRightWall = addWallWithHoles(roofRightWallSettings);
    const roofBackWall = addWallWithHoles(roofBackWallSettings);

    const floorGroup = new THREE.Group();

    // Position the walls correctly based on your scene's coordinate system
    // Adjust the positioning logic as needed

    // Add a floor ground plane
    const floorGeometry = new THREE.BoxGeometry(roofFrontWallSettings.width + roofLeftWallSettings.depth, floorThickness, roofLeftWallSettings.width);
    const floorMesh = new THREE.Mesh(floorGeometry, material); // Use the provided material for the floor

    // Position the walls
    // left wall
    roofLeftWall.position.x = roofFrontWall.position.x - (roofFrontWallSettings.width / 2) + (roofLeftWallSettings.depth / 2); 
    roofLeftWall.position.y = roofFrontWall.position.y; // Align with frontWall on the y-axis
    roofLeftWall.position.z = roofFrontWall.position.z + (roofFrontWallSettings.depth / 2) - (roofLeftWallSettings.width / 2); // Align with frontWall on the z-axis
    roofLeftWall.rotation.y = -Math.PI / 2; // Rotate 90 degrees to make the angle
    // right wall opposite of left wall
    roofRightWall.position.x = roofLeftWall.position.x + roofFrontWallSettings.width;
    roofRightWall.position.y = roofFrontWall.position.y; // Align with frontWall on the y-axis
    roofRightWall.position.z = roofLeftWall.position.z; // Align with leftWall on the z-axis
    roofRightWall.rotation.y = Math.PI / 2; // Rotate to face the opposite direction
    // back wall opposite of front wall
    roofBackWall.position.x = roofFrontWall.position.x;
    roofBackWall.position.y = roofFrontWall.position.y; // Align with frontWall on the y-axis
    roofBackWall.position.z = roofFrontWall.position.z - roofLeftWallSettings.width + roofFrontWallSettings.depth; // Align with frontwall on the z-axis

    // add a floor ground plane if needed

    // Position the floor
    // Assuming wallMesh1.position.y is the base of the walls, adjust if necessary
    floorMesh.position.x = roofFrontWall.position.x + (roofLeftWallSettings.depth / 2); // Centered between wall2 and wall4
    floorMesh.position.y = roofFrontWall.position.y - (roofLeftWallSettings.height / 2); // Just below the walls, adjust if your wallMesh1.position.y is not the base
    floorMesh.position.z = roofLeftWall.position.z; // Centered between wall1 and wall3


    // Example positioning logic (adjust as necessary)
    floorMesh.position.set(roofFrontWall.position.x + (roofLeftWallSettings.depth / 2), roofFrontWall.position.y - (roofFrontWallSettings.height / 2), roofLeftWall.position.z);
    
    // Add railing to the roof
    const railingHeight = roofBoxSettings.leftSide.height - roofFrontWallSettings.height + 0.01;
    const railingSpace = 0.3;
    const railingMaterial : IBalconyMaterials = {
        default: new THREE.MeshLambertMaterial({ color: 0x00ff00 }), // Green railing
        alu: new THREE.MeshLambertMaterial({ color: 0x111111 }) // Dark grey railing
    }
    const railingLeft = balconyRaling({
        width: roofLeftWallSettings.width - roofFrontWallSettings.depth,
        height: railingHeight,
        space: railingSpace,
        materials: railingMaterial
    });
    railingLeft.rotation.y = Math.PI / -2;
    railingLeft.position.x = roofLeftWall.position.x - roofLeftWallSettings.depth / 2;
    railingLeft.position.y = roofLeftWall.position.y - roofLeftWallSettings.height / 2 + railingHeight / 2;
    railingLeft.position.z = roofLeftWall.position.z - roofFrontWallSettings.depth / 2;
    floorMesh.add(railingLeft);
    
    // const railingRight = railingLeft.clone();
    // railingRight.position.x = roofRightWall.position.x - roofLeftWallSettings.depth / 2;
    // floorMesh.add(railingRight);

    // const railingFront = balconyRaling({
    //     width: roofFrontWallSettings.width - roofLeftWallSettings.depth,
    //     height: railingHeight,
    //     space: railingSpace,
    //     materials: railingMaterial
    // });
    // railingFront.rotation.y = Math.PI;
    // railingFront.position.x = roofFrontWall.position.x + roofFrontWallSettings.width / 2;
    // railingFront.position.y = roofFrontWall.position.y - roofFrontWallSettings.height + railingHeight / 2;
    // railingFront.position.z = roofFrontWall.position.z + roofLeftWallSettings.width / 2 - roofLeftWallSettings.depth / 2;
    // floorMesh.add(railingFront);

    // const railingBAck = railingFront.clone();
    // railingBAck.position.z = roofBackWall.position.z + roofLeftWallSettings.width / 2 - roofLeftWallSettings.depth / 2;
    // floorMesh.add(railingBAck);



    // Additional structure on top (adjust as necessary)
    const roofDepth = roofBoxSettings.frontSide.width;
    
    const roofBox = addFloorCustom(roofBoxSettings.frontSide, roofBoxSettings.leftSide, roofBoxSettings.backSide, roofBoxSettings.backSide, false, material);
    roofBox.position.y = floorMesh.position.y + floorThickness + roofBoxSettings.leftSide.height / 2 + 0.01;

    const flatRoofGeometry = new THREE.BoxGeometry(roofBoxSettings.frontSide.width + roofBoxSettings.frontSide.depth, 0.1, roofDepth);
    // Create the flatRoof mesh with the corrected geometry
    const flatRoof = new THREE.Mesh(flatRoofGeometry, woodMaterial);

    flatRoof.position.x = roofBox.position.x + roofBoxSettings.leftSide.depth / 2;
    flatRoof.position.y = roofBox.position.y + roofBoxSettings.leftSide.height / 2 + 0.05;
    flatRoof.position.z = roofBox.position.z - roofBoxSettings.leftSide.width / 2 + roofBoxSettings.leftSide.depth / 2;

    // Add all elements to the group
    floorGroup.add(roofFrontWall, roofLeftWall, roofRightWall, roofBackWall, floorMesh, roofBox, flatRoof);

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