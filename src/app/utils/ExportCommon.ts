import {PreviewOptions} from '../customizer-data-types';

export const defaultMeshRotation = (mesh, mAngle, quaternionBase?: BABYLON.Quaternion) => {

    // @7frank TODO change axis for m1-garand and other models to rotate

    if (!quaternionBase) {

        const axis = new BABYLON.Vector3(-1, 1, 0);
        const angle = Math.PI / 4;
        quaternionBase = BABYLON.Quaternion.RotationAxis(axis, angle);
    }
    // rotate around the y-axis
    const axis2 = new BABYLON.Vector3(0, 1, 0);
    const quaternionRotation = BABYLON.Quaternion.RotationAxis(axis2, mAngle);

    //  mesh.rotationQuaternion = rotationOffset.multiplyInPlace(quaternionRotation).multiply(quaternionBase);
    mesh.rotationQuaternion = quaternionRotation.multiply(quaternionBase);
};


/**

 export const defaultMeshRotation = (mesh, mAngle, rotationOffset = new BABYLON.Quaternion()) => {

    // @7frank TODO change axis for m1-garand and other models to rotate
    const axis = new BABYLON.Vector3(-1, 1, 0);
    const angle = Math.PI / 4;
    const quaternionBase: BABYLON.Quaternion = BABYLON.Quaternion.RotationAxis(axis, angle);

    // rotate around the y-axis
    const axis2 = new BABYLON.Vector3(0, 1, 0);
    const quaternionRotation = BABYLON.Quaternion.RotationAxis(axis2, mAngle);

  //  mesh.rotationQuaternion = rotationOffset.multiplyInPlace(quaternionRotation).multiply(quaternionBase);
    mesh.rotationQuaternion = quaternionRotation.multiply(quaternionBase);
};

 */

export interface IExportPreview {
    enablePreview(mesh: BABYLON.Mesh, previewOptions: PreviewOptions);

    setPreviewTargetRotation(angle: number);

    disablePreview();
}

export function createDefaultParticleSystem(scene: BABYLON.Scene, emitterObject): BABYLON.ParticleSystem {


    // Create a particle system
    const particleSystem = new BABYLON.ParticleSystem('particles', 300, scene);

    // Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture('/assets/textures/particles/dot8.png', scene);

    // Where the particles come from
    particleSystem.emitter = emitterObject; // the starting object, the emitter
    const emitterType = new BABYLON.ConeParticleEmitter();
    emitterType.radius = 0.4;
    // emitterType.radiusRange = 0;

    particleSystem.particleEmitterType = emitterType;

    // Colors of all particles
    particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

    // Size of each particle (random between...

    particleSystem.minSize = 0.05 * 0.6;
    particleSystem.maxSize = 0.05 * 0.6;

    // Life time of each particle (random between...
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;

    // Emission rate
    particleSystem.emitRate = 50;


    //  Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);

    // Angular speed, in radians
    // particleSystem.minAngularSpeed = 0;
    // particleSystem.maxAngularSpeed = Math.PI;

    // Speed
    particleSystem.minEmitPower = 0.7;
    particleSystem.maxEmitPower = 1.1;

    particleSystem.updateSpeed = 0.01;

    // particleSystem.addVelocityGradient(0, 3, 5);
    // particleSystem.addVelocityGradient(1.0, -5, -10);

    // Start the particle system
    particleSystem['preWarmCycles'] = 10;
    particleSystem['preWarmStepOffset'] = 5;
    // particleSystem.start();

    return particleSystem;

}

export function createSpotLight(scene: BABYLON.Scene): BABYLON.SpotLight {

    // Light direction is directly down from a position one unit up, slow decay
    const spotLight = new BABYLON.SpotLight('spotLight', new BABYLON.Vector3(1, 2, 1), new BABYLON.Vector3(0, -1, 0), Math.PI / 2, 18, scene);
    spotLight.diffuse = new BABYLON.Color3(0, 1, 1);
    spotLight.specular = new BABYLON.Color3(1, 1, 1);
    spotLight.shadowEnabled = true;


    return spotLight;

}

export function createGround(scene: BABYLON.Scene): BABYLON.Mesh {

    const texture = new BABYLON.Texture('/assets/preview/plate4.jpg', scene);
    texture.uScale = 3;
    texture.vScale = 3;


    const groundMaterial = new BABYLON.StandardMaterial('myMaterial', scene);

    //  groundMaterial.diffuseTexture = texture;
    groundMaterial.diffuseColor = new BABYLON.Color3(.5, .5, .5);

    const myGround = BABYLON.MeshBuilder.CreateGround('myGround', {width: 9, height: 9}, scene);
    myGround.position.y = -0.5;
    myGround.receiveShadows = true;

    myGround.material = groundMaterial;


    return myGround;
}

export function createLightTube(radii: Array<number>, height, scene) {

    const path = [];
    path.push(new BABYLON.Vector3(0, -height / 2, 0)); //point 1A
    path.push(new BABYLON.Vector3(0, height / 2, 0)); //point 2

    const radiusFunction = function (i, distance) {
        return radii[i];
    };

    return BABYLON.Mesh.CreateTube('tube', path, 2, 6, radiusFunction, 0, scene, false, BABYLON.Mesh.FRONTSIDE);

}

export interface FileUploadResponse {
    url: string;
    blob: Blob;
}

export
    type FileUploadProgressCallback = (current: number, type?: string) => void;


/**
 * Some options for the video converter
 */
export interface VideoConverterOptions {
    quality?: number;
    framesPerSecond?: number;
    totalFrames?: number;
}


/*
interface IConverter {
}

interface IBaseConverter {
    converter: IConverter;
    grabFrames(scene: BABYLON.Scene, canvasElement: HTMLCanvasElement, mesh: BABYLON.Mesh): Promise<any>;
    createConverter();
    cancel();

}
*/

