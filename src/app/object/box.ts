import {JPR, WeaponCustomization} from '../customizer-data-types';

export const box: WeaponCustomization = {
    name: 'Box',
    modelFolder: 'assets/models/box/',
    modelFile: 'box.gltf',
    svgPath: 'assets/img/weapon-icons/aa12.svg',
    preview: {
        orientation: new JPR(0, -Math.PI / 6, 0),
        camera: {
            position: new BABYLON.Vector3(-2, -0.05, 0),
            target: new BABYLON.Vector3(0, -0.1, 0)
        }

    },
    materials: [
        // {
        //     name: 'acog_mat_new',
        //     texture: 'assets/textures/common/acog_mat_baseColor.jpg',
        //     normalMap: 'assets/textures/common/acog_normal.jpg',
        // },

    ],
    faces: [
        {
            name: 'front',
            position: new BABYLON.Vector3(0, 0, 0.5),
            rotation: new BABYLON.Vector3(0, 0, 0),
            camera: {
                alpha: Math.PI / 2,
                beta: Math.PI / 2,
            },
            mesh: '0',
            isHMenu: true
        },
        {
            name: 'left',
            position: new BABYLON.Vector3(0.5, 0, 0),
            rotation: new BABYLON.Vector3(0, 0, 0),
            camera: {
                alpha: 0,
                beta: Math.PI / 2,
            },
            mesh: '1',
            isHMenu: true
        },
    ],

    
    replaceMaterials: [
        // {
        //     newMaterialName: 'acog_mat_new',
        //     oldMaterialNames: ['acog_mat']
        // },

    ],
    // scale: {
    //     x: -0.0075,
    //     y: 0.0075,
    //     z: 0.0075
    // },
    customizations: [


    ]
};