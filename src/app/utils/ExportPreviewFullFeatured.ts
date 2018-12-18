import {createDefaultParticleSystem, createGround, createSpotLight} from './ExportCommon';
import {BaseExportPreview} from './BaseExportPreview';
import {addDefaultPlatformLight, createPlatform} from './ExportExt';
import {PreviewOptions} from '../customizer-data-types';


/**
 * setup a scene where the mesh will be rendered in preview mode
 *
 *
 * TODO @7frank extends RawExportPreview
 */

export class ExportPreviewFullFeatured extends BaseExportPreview {


    public spotLight: BABYLON.SpotLight;
    public particles: BABYLON.ParticleSystem;
    public platform: BABYLON.Mesh;

    public defaultPlatformMaterial: BABYLON.StandardMaterial;

    public ground: BABYLON.Mesh;

    enablePreview(mesh: BABYLON.Mesh, previewOptions: PreviewOptions) {

        super.enablePreview(mesh, previewOptions);
        this.particles.start();
        this.spotLight.setEnabled(true);
        this.platform.visibility = 1;

        this.spotLight.setDirectionToTarget(mesh.position);
        this.addShadow(this.spotLight, mesh, 16);


    }


    disablePreview() {
        super.disablePreview();

        this.spotLight.setEnabled(false);
        this.platform.visibility = 0;
        this.particles.stop();


        // remove shadow of the rendered target again
        this.shadowMaps.get(this.spotLight).removeShadowCaster(this.currentObject);

    }


    setupPreviewElements() {

        super.setupPreviewElements();

        this.defaultPlatformMaterial = new BABYLON.StandardMaterial('redMat', this.scene);
        this.defaultPlatformMaterial.emissiveColor = new BABYLON.Color3(0, 0.6, 0.6);


        this.spotLight = createSpotLight(this.scene);


        this.ground = createGround(this.scene);
        this.children.push(this.ground);


        // add platform

        this.platform = createPlatform(this);
        const setLightIntensity = addDefaultPlatformLight(this);


        this.children.push(...this.platform.getChildMeshes());

        const glow = new BABYLON.GlowLayer('glow', this.scene, {
            mainTextureFixedSize: 256,
            blurKernelSize: 64
        });

        let t = 0;
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.enabled) return;
            t += 0.1;
            glow.intensity = Math.cos(t) * 0.4 + 0.4;
            setLightIntensity(Math.cos(t) * 0.1 + 0.25);
        });


        // create particles
        this.particles = createDefaultParticleSystem(this.scene, this.platform);
        this.particles.renderingGroupId = 0;


    }


}
