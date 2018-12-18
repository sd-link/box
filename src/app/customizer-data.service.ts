import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {box} from './object/box';
 
import {AppearanceOption, WeaponCustomizationData} from './customizer-data-types';
 

const weaponsAvailable = [
    box,
 
];
let weaponsConfig;

function setup() {
    const hash = window.location.hash.substr(1);

    if (hash== "") {
        weaponsConfig = weaponsAvailable
    return 
    }
    const opt = hash.split('');
    const id = parseInt(opt[0], 10);

    const hasMaterials = Boolean(parseInt(opt[1], 10));

    if (!hasMaterials)
    weaponsAvailable[id].materials = []


    weaponsConfig = [weaponsAvailable[id]];


}

setup();


window.addEventListener('hashchange', function () {
window.location.reload();
}, false);


@Injectable({
    providedIn: 'root'
})
export class CustomizerDataService {
    constructor() {
    }

    generateTextureOptions(count: number, filePattern: string, descriptionPattern: string): AppearanceOption[] {
        const options: AppearanceOption[] = [];

        for (let i = 1; i <= count; ++i) {
            const numStr = i < 10 ? ('0' + i) : i.toString();
            const uri = 'assets/img/patterns/' + filePattern.replace('#', numStr);

            options.push({
                name: descriptionPattern.replace('#', numStr),
                displayImg: uri,
                interactionValue: uri
            });
        }

        return options;
    }

    weaponsData(): Observable<WeaponCustomizationData> {
        let textureOptions = this.generateTextureOptions(12, 'BW/bw_pattern_#.jpg', 'BW Pattern #');
        textureOptions = textureOptions.concat(this.generateTextureOptions(20, 'Colorful1/colorful1_pattern_#.jpg', 'Colorful1 Pattern #'));
        textureOptions = textureOptions.concat(this.generateTextureOptions(10, 'Colorful2/colorful2_pattern_#.jpg', 'Colorful2 Pattern #'));

        return of({
            environment: 'assets/textures/environments/parking.hdr',
            commonMaterials: [
                {
                    name: 'Silver',
                    color: '#fcfaf5',
                    metal: true,
                    roughness: 0.32
                },
                {
                    name: 'Plastic',
                    color: '#ffffff',
                    metal: false,
                    roughness: 0.48
                }
            ],
            commonSections: [
                {
                    svgPath: 'assets/img/section-icons/materials.svg',
                    name: 'Material',
                    globalReset: true,
                    interactionType: 'swapMaterial',
                    optionGroups: [
                        {
                            allowNone: true,
                            options: [
                                {
                                    name: 'Silver',
                                    displayImg: 'assets/img/material-icons/Silver_Icon_128.png',
                                    interactionValue: 'Silver'
                                },
                                {
                                    name: 'Plastic',
                                    displayImg: 'assets/img/material-icons/Plastic_Icon_128.png',
                                    interactionValue: 'Plastic'
                                }
                            ]
                        }
                    ]
                },
                {
                    svgPath: 'assets/img/section-icons/color.svg',
                    name: 'Color',
                    globalReset: true,
                    interactionType: 'alterMaterial',
                    affectedParameter: 'color',
                    optionGroups: [
                        {
                            allowNone: true,
                            options: [
                                {
                                    name: 'Silver',
                                    displayColor: '#fcfaf5',
                                    interactionValue: '#fcfaf5'
                                },
                                {
                                    name: 'Gold',
                                    displayColor: '#ffe29b',
                                    interactionValue: '#ffe29b'
                                },
                                {
                                    name: 'White',
                                    displayColor: '#FFFFFF',
                                    interactionValue: '#FFFFFF'
                                },
                                {
                                    name: 'Pink',
                                    displayColor: '#EE82EE',
                                    interactionValue: '#EE82EE'
                                },
                                {
                                    name: 'Fuchsia',
                                    displayColor: '#800080',
                                    interactionValue: '#800080'
                                },
                                {
                                    name: 'Blue',
                                    displayColor: '#000080',
                                    interactionValue: '#000080'
                                },
                                {
                                    name: 'Teal',
                                    displayColor: '#7FFFD4',
                                    interactionValue: '#7FFFD4'
                                },
                                {
                                    name: 'Lime',
                                    displayColor: '#00FF00',
                                    interactionValue: '#00FF00'
                                },
                                {
                                    name: 'Green',
                                    displayColor: '#008000',
                                    interactionValue: '#008000'
                                },
                                {
                                    name: 'Yellow',
                                    displayColor: '#FFFF00',
                                    interactionValue: '#FFFF00'
                                },
                                {
                                    name: 'Orange',
                                    displayColor: '#FFA500',
                                    interactionValue: '#FFA500'
                                },
                                {
                                    name: 'Red',
                                    displayColor: '#FF0000',
                                    interactionValue: '#FF0000'
                                }
                            ]
                        }
                    ]
                },
                {
                    svgPath: 'assets/img/section-icons/textures.svg',
                    name: 'Patterns',
                    globalReset: true,
                    interactionType: 'alterMaterial',
                    affectedParameter: 'texture',
                    optionGroups: [
                        {
                            allowNone: true,
                            options: textureOptions
                        }
                    ]
                }
            ],
            weapons: weaponsConfig
        });
    }
}

