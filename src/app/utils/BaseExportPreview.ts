import config from '../share-modal/config';
import {defaultMeshRotation, IExportPreview} from './ExportCommon';
import {PreviewOptions} from '../customizer-data-types';


/**
 * setup a scene where the mesh will be rendered in preview mode
 *
 *
 * TODO @7frank extends RawExportPreview
 */

export class BaseExportPreview implements IExportPreview {

    public children = new Array<BABYLON.AbstractMesh>();
    public camera: BABYLON.ArcRotateCamera;
    protected enabled = false;
    protected shadowMaps = new Map<BABYLON.IShadowLight, BABYLON.ShadowGenerator>();
    protected currentObject: BABYLON.Mesh;
    private debug = config.debug;
    private defaultClearColor: BABYLON.Color4;
    private currObjectRotation: BABYLON.Quaternion;
    private prevCamera: BABYLON.Nullable<BABYLON.Camera>;
    // this will set the mesh initial rotation
    private rotationOffset: BABYLON.Quaternion;

    constructor(public scene: BABYLON.Scene, private displayCanvas: HTMLCanvasElement) {

        this.setupPreviewElements();

    }


    setPreviewTargetRotation(angle = 0) {
        defaultMeshRotation(this.currentObject, angle, this.rotationOffset);

    }

    enablePreview(mesh: BABYLON.Mesh, previewOptions: PreviewOptions) {

        const orientation = previewOptions.orientation;
        //   const axis = new BABYLON.Vector3(1, 0, 0);
        //   this.rotationOffset  = BABYLON.Quaternion.RotationAxis(axis, orientation.pitch);
        this.rotationOffset = BABYLON.Quaternion.RotationYawPitchRoll(orientation.yaw, orientation.pitch, orientation.roll);

        if (previewOptions.camera.position) {
            this.camera.setPosition(previewOptions.camera.position);
        }

        if (previewOptions.camera.target) {
            this.camera.setTarget(previewOptions.camera.target);
        }


        this.enabled = true;
        this.currentObject = mesh;

        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

        this.currObjectRotation = mesh.rotationQuaternion.clone();

        //  defaultMeshRotation(mesh, 0, this.rotationOffset);
        this.setPreviewTargetRotation(0);

        this.prevCamera = this.scene.activeCamera;


        this.scene.activeCamera = this.camera;


        this.children.forEach((el => {
            el.visibility = 1;
            el.isPickable = false;
        }));

    }

    disablePreview() {
        this.enabled = false;
        this.currentObject.rotationQuaternion = this.currObjectRotation;

        this.scene.activeCamera = this.prevCamera;

        this.scene.clearColor = this.defaultClearColor;

        this.children.forEach((el => el.visibility = 0));

    }

    setupPreviewElements() {


        this.defaultClearColor = this.scene.clearColor;

        if (!this.camera) {
            this.camera = this.createPreviewCamera();
        }


    }

    addShadow(light: BABYLON.IShadowLight, mesh: BABYLON.Mesh, blurKernel: number = 32) {
        // Shadows
        let shadowGenerator = this.shadowMaps.get(light);
        if (!shadowGenerator) {

            shadowGenerator = new BABYLON.ShadowGenerator(2048, light);

            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.useKernelBlur = true;
            shadowGenerator.blurKernel = blurKernel;

            //  shadowGenerator.usePoissonSampling = true;
            //  shadowGenerator.bias = .0001;

            this.shadowMaps.set(light, shadowGenerator);
        }


        // shadowGenerator.getShadowMap().renderList.push(mesh);
        shadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME;
        shadowGenerator.addShadowCaster(mesh);


    }


    createPreviewCamera(): BABYLON.ArcRotateCamera {
        const camera = new BABYLON.ArcRotateCamera('previewCamera', 0, Math.PI / 2, 2,
            new BABYLON.Vector3(0, 0, 0), this.scene, false);

        if (this.debug) {
            camera.attachControl(this.displayCanvas);
        }
        camera.setPosition(new BABYLON.Vector3(-2, 1, 0).multiplyByFloats(0.7, 0.7, 0.7));
        camera.setTarget(new BABYLON.Vector3(0, -.22, 0));
        camera.useFramingBehavior = true;
        camera.wheelPrecision = 500;
        camera.pinchPrecision = 200;
        camera.minZ = 0.01;
        camera.lowerRadiusLimit = 0.01;
        camera.upperRadiusLimit = 5;
        return camera;

    }


}