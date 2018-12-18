import {createLightTube} from './ExportCommon';
import {ExportPreviewFullFeatured} from './ExportPreviewFullFeatured';

type setLightIntensityCallback = (val: number) => void;

export function createPlatform(that: ExportPreviewFullFeatured) {
    const glowMat = that.defaultPlatformMaterial;

    const node = new BABYLON.Mesh('plattform', that.scene);

    const platform = BABYLON.MeshBuilder.CreateCylinder('plattform-inner', {tessellation: 6, height: 0.02, diameter: 0.8}, that.scene);

    platform.material = glowMat;
    that.addShadow(that.spotLight, platform, 16);


    platform.setParent(node);

    node.position.y = -0.45;
    node.rotation.y = Math.PI / 2;


    // platform.rotation.x = Math.PI / 2;
    platform.rotation.y = Math.PI / 2;
    platform.scaling.y = 0.01;
    platform.position.y = 0.04;


    const torus = BABYLON.Mesh.CreateTorus('plattform-middle', 1, 0.05, 6, that.scene, false, BABYLON.Mesh.DEFAULTSIDE);
    const torus2 = BABYLON.Mesh.CreateTorus('plattform-outer', 1.2, 0.05, 6, that.scene, false, BABYLON.Mesh.DEFAULTSIDE);


    that.addShadow(that.spotLight, torus, 16);
    that.addShadow(that.spotLight, torus2, 16);


    torus.position.y = 0.03;


    torus.receiveShadows = true;
    torus2.receiveShadows = true;


    const transparentMat = new BABYLON.StandardMaterial('transparentMat', that.scene);
    transparentMat.diffuseColor = new BABYLON.Color3(0, 1, 1);
    transparentMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    transparentMat.alpha = 0.4;


    torus.material = glowMat;
    torus2.material = glowMat;

    torus.parent = node;
    torus2.parent = node;

    torus.scaling.y = 0.1;
    torus2.scaling.y = 0.1;
    return node;
}


export function addGodrays(that: ExportPreviewFullFeatured): setLightIntensityCallback {

    const hole = BABYLON.MeshBuilder.CreateCylinder('plattform-inner', {tessellation: 6, height: 0.02, diameter: 0.8}, that.scene);
    hole.rotation.y = Math.PI / 2;
    hole.scaling.y = 0.01;
    hole.position.y = 0.04;

    that.children.push(hole);

    const hmat = new BABYLON.StandardMaterial('hMat', that.scene);
    // hmat.diffuseColor = new BABYLON.Color4(1, 1, 1, 1);
    hmat.diffuseTexture = new BABYLON.Texture('http://upload.wikimedia.org/wikipedia/commons/e/eb/Blank.jpg', that.scene, true, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
    hmat.diffuseTexture.level = 1;
    hmat.diffuseTexture.hasAlpha = false;

    hole.material = hmat;

    const godrays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, that.camera, hole, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, that.scene.getEngine(), false);


    godrays.mesh.position.y = -0.4;
    godrays.mesh.rotation.y = 0;

    godrays.useDiffuseColor = true;
    godrays.mesh.material['diffuseColor'] = new BABYLON.Color3(0, 1, 1);


    godrays.exposure = 0.3;
    godrays.decay = 0.98;
    godrays.weight = 0.2;
    godrays.density = 0.926;


    return (val) => {
        godrays.density = val;
    };
}

export function addDefaultPlatformLight(that: ExportPreviewFullFeatured): setLightIntensityCallback {

    const texture = new BABYLON.Texture('/assets/preview/light-beam-gradient.png', that.scene);
    texture.uScale = 1;
    texture.vScale = 1;

    const opTexture = new BABYLON.Texture('/assets/preview/beam-opacity.jpg', that.scene, false, true);
    opTexture.uScale = 1;
    opTexture.vScale = 1;


    const mLightMat = new BABYLON.StandardMaterial('texture4', that.scene);
    mLightMat.emissiveColor = new BABYLON.Color3(0, 1, 1);
    mLightMat.opacityTexture = opTexture;
    mLightMat.opacityTexture['wAng'] = Math.PI;
    mLightMat.opacityTexture.getAlphaFromRGB = true;


    const lightBeam = createLightTube([0.4, 0.5], 1, that.scene);
    lightBeam.rotation.y = Math.PI / 2;


    that.children.push(lightBeam);
    lightBeam.setParent(that.platform);
    lightBeam.position.y = .55;
    lightBeam.visibility = 0.1;
    //lightBeam.parent = that.platform;
    lightBeam.material = mLightMat;


    that.spotLight.excludedMeshes.push(lightBeam);

    return (val) => {
        lightBeam.visibility = val;
    };
}
