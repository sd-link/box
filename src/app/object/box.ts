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
            mesh: 'f1',
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
            mesh: 'f3',
            isHMenu: true
        },
        {
            name: 'right',
            position: new BABYLON.Vector3(-0.5, 0, 0),
            rotation: new BABYLON.Vector3(0, 0, 0),
            camera: {
                alpha: Math.PI,
                beta: Math.PI / 2,
            },
            mesh: 'f6',
            isHMenu: true
        },
        {
            name: 'back',
            position: new BABYLON.Vector3(0, 0, -0.5),
            rotation: new BABYLON.Vector3(0, 0, 0),
            camera: {
                alpha: Math.PI * 3 / 2,
                beta: Math.PI / 2,
            },
            mesh: 'f2',
            isHMenu: true
        },
        {
            name: 'top',
            position: new BABYLON.Vector3(0.02, 0.5, 0),
            rotation: new BABYLON.Vector3(0, 0, 0),
            camera: {
                alpha: 0,
                beta: 0,
            },
            mesh: 'f4',
            isHMenu: false
        },
        {
            name: 'bottom',
            position: new BABYLON.Vector3(0.02, -0.5, 0),
            rotation: new BABYLON.Vector3(0, 0, 0),
            camera: {
                alpha: 0,
                beta: Math.PI,
            },
            mesh: 'f5',
            isHMenu: false
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