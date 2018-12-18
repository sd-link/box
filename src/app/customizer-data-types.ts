/**
 * Note: the current implementation only uses pitch
 */
export class JPR {
    constructor(public yaw = 0, public pitch = 0, public roll = 0) {

    }
}

/**
 * The preview options are meant to be used for whenever the sharing dialog is opened and a video is exported.
 * Orientation and camera are used to override the defaults.
 */
export interface PreviewOptions {
    orientation: JPR;
    camera?: {
        position?: BABYLON.Vector3, target?: BABYLON.Vector3
    };
}

export interface MaterialProperties {
    name: string;
    color?: string;
    texture?: string;
    metal?: boolean;
    roughness?: number;
    metallicRoughnessMap?: string;
    normalMap?: string;
}

export interface MaterialReplacement {
    newMaterialName: string;
    oldMaterialNames: string[];
}

export interface Value3D {
    x: number;
    y: number;
    z: number;
}

export interface AjustmentMesh {
    name: string;
    interactionValue: string;
    position: Value3D;
}

export interface PostLoadAction {
    type: string;
    target: string;
}

export interface AppearanceOption {
    name: string;
    displayImg?: string;
    displayColor?: string;
    interactionValue: string;
    ajustment?: AjustmentMesh[];
    include?: string;
    exclude?: string[];
}

export interface AppearanceOptionGroup {
    allowNone: boolean;
    defaultSelected?: number;
    options: AppearanceOption[];
}

export interface AppearanceSection {
    svgPath: string;
    name: string;
    globalReset: boolean;
    interactionType: string;
    affectedParameter?: string;
    optionGroups: AppearanceOptionGroup[];
}

export interface WeaponCustomization {
    modelFolder: string;
    modelFile: string;
    svgPath: string;
    name: string;
    scale?: Value3D;
    rotation?: Value3D;
    faces?: Face3D[];
    position?: Value3D;
    preview: PreviewOptions;
    interactionBlacklist?: string[];
    materials?: MaterialProperties[];
    replaceMaterials?: MaterialReplacement[];
    setupActions?: PostLoadAction[];
    customizations: AppearanceSection[];
}

export interface Face3D {
    name: string;
    mesh: string;
    position: Value3D;
    rotation: Value3D;
}

export interface WeaponCustomizationData {
    environment?: string;
    commonMaterials?: MaterialProperties[];
    commonSections?: AppearanceSection[];
    weapons: WeaponCustomization[];
}