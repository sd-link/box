import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface CartesianTriple {
  x: number;
  y: number;
  z: number;
}

export interface GridDefinition {
  hCount: number;
  vCount: number;
  requiredHeight?: number;
  maxHeight?: number;
  center: CartesianTriple;
}

export interface MaterialReplacement {
  newMaterialName: string;
  oldMaterialNames: string[];
}

export interface ScalingDetails {
  originalSize: CartesianTriple;
  constantEdgeSize: CartesianTriple;
  scale?: CartesianTriple;
}

export interface FurnitureObject {
  name: string;
  modelPieces: string[];
  partsStyled?: string[];
  materialReplacements?: MaterialReplacement[];
  gridsProvided?: GridDefinition[];
  baseAnchors?: CartesianTriple[];
  gridPatternRequired?: GridDefinition[];
  canUseBaseAnchor?: boolean;
  scaling?: ScalingDetails;
}

export interface AreaDefinition {
  width: number;
  depth: number;
}

export interface SizeDefinition {
  height: number;
  areas: AreaDefinition[];
}

export interface AppearanceInfo {
  colorChoices?: string[];
  sizes?: SizeDefinition[];
  model: FurnitureObject;
}

export interface CustomizerOption {
  imgURL?: string;
  text?: string;
  material?: string;
  appearance?: AppearanceInfo;
}

export interface CustomizerItem {
  type: string;
  text?: string;
  options?: CustomizerOption[];
}

export interface CustomizerSection {
  imgURL: string;
  name: string;
  foundation?: boolean;
  pieces: CustomizerItem[];
}

export interface CustomizerTab {
  imgURL: string;
  name: string;
  sections: CustomizerSection[];
}

export interface MaterialProperties {
  name: string;
  color?: string;
  texture?: string;
  metal?: boolean;
  roughness?: number;
  metallicRoughnessMap?: string;
  normalMap?: string;
  transparent?: boolean;
}

export interface Model {
  name: string;
  root: string;
  file: string;
  materialReplacements?: MaterialReplacement[];
}

export interface AppearanceConfig {
  environment?: string;
  scene?: Model;
  allMaterials?: MaterialProperties[];
  allModelPieces: Model[];
  tabs: CustomizerTab[];
}

@Injectable({
  providedIn: 'root'
})
export class AppearanceDataService {
  static GenerateConfiguration(): AppearanceConfig {
    const assetsDir = 'assets/';

    const images = assetsDir + 'img/';
    const tabIcons = images + 'tab-icons/';
    const itemIcons = images + 'item-icons/';
    const textures = images + 'textures/';

    const modelsDir = assetsDir + 'models/';

    const blackAndWhite = [
      '#27292b',
      '#ecece7'
    ];

    const blackWhiteGrey = [
      '#27292b',
      '#ecece7',
      '#6b6a69'
    ];

    const boxColors = [
      '#d05d28',
      '#46877f',
      '#c5c7c4',
      '#ecece7',
      '#27292b',
      '#6b6a69',
      '#553d3e',
      '#bda3a5',
      '#8b9916',
      '#84b6a2',
      '#7ab5ae',
      '#00505a',
      '#b5cdd7',
      '#5e5871',
      '#553e51',
      '#695a67',
      '#8e6b76',
      '#0d2f5a',
      '#682d63',
      '#685c27',
      '#eebabc'
    ];

    const materials: MaterialProperties[] = [
      {
        name: 'BaseWood',
        texture: textures + 'Base_wood_tex.jpg',
        metal: false,
        roughness: 0.92
      },
      {
        name: 'FrameWood',
        texture: textures + 'Frame_Wood.jpg',
        metal: false,
        roughness: 0.92
      },
      {
        name: 'Painted',
        metal: false,
        roughness: 0.86
      },
      {
        name: 'GrayFloor',
        color: '#ffffff',
        metal: false,
        roughness: 0.86
      }
    ];

    const modelPieces: Model[] = [
      {
        name: 'Base',
        root: modelsDir + 'Base/',
        file: 'Base.gltf',
        materialReplacements: [
          {
            newMaterialName: 'Painted',
            oldMaterialNames: ['material1']
          },
          {
            newMaterialName: 'BaseWood',
            oldMaterialNames: ['Wood_Bamboo1']
          },
          {
            newMaterialName: 'FrameWood',
            oldMaterialNames: ['Wood_Veneer_02']
          }
        ]
      },
      {
        name: 'Base_Door_01',
        root: modelsDir + 'Base_Door_01/',
        file: 'Base_Door_01.gltf',
        materialReplacements: [
          {
            newMaterialName: 'Painted',
            oldMaterialNames: ['material1']
          }
        ]
      },
      {
        name: 'Base_Door_02',
        root: modelsDir + 'Base_Door_02/',
        file: 'Base_Door_02.gltf',
        materialReplacements: [
          {
            newMaterialName: 'Painted',
            oldMaterialNames: ['material1']
          }
        ]
      },
      {
        name: 'Plate',
        root: modelsDir + 'Plate/',
        file: 'Plate.gltf'
      },
      {
        name: 'Box_03',
        root: modelsDir + 'Box_03/',
        file: 'Box_03.gltf'
      },
      {
        name: 'Feet_SteelFrame_01',
        root: modelsDir + 'Feet_SteelFrame_01/',
        file: 'Feet_SteelFrame_01.gltf',
        materialReplacements: [
          {
            newMaterialName: 'BaseWood',
            oldMaterialNames: ['Wood_Bamboo1']
          },
          {
            newMaterialName: 'Painted',
            oldMaterialNames: ['lambert1']
          }
        ]
      },
      {
        name: 'Feet_SteelFrame_02',
        root: modelsDir + 'Feet_SteelFrame_02/',
        file: 'Feet_SteelFrame_02.gltf',
        materialReplacements: [
          {
            newMaterialName: 'BaseWood',
            oldMaterialNames: ['Wood_Bamboo1']
          },
          {
            newMaterialName: 'Painted',
            oldMaterialNames: ['lambert1']
          }
        ]
      },
      {
        name: 'Feet_SteelFrame_03',
        root: modelsDir + 'Feet_SteelFrame_03/',
        file: 'Feet_SteelFrame_03.gltf',
        materialReplacements: [
          {
            newMaterialName: 'BaseWood',
            oldMaterialNames: ['Wood_Bamboo1']
          },
          {
            newMaterialName: 'Painted',
            oldMaterialNames: ['lambert1']
          }
        ]
      },
      {
        name: 'Feet_Wood_01',
        root: modelsDir + 'Feet_Wood_01/',
        file: 'Feet_Wood_01.gltf',
        materialReplacements: [
          {
            newMaterialName: 'FrameWood',
            oldMaterialNames: ['lambert1']
          }
        ]
      }
    ];

    const feetStand1: CustomizerOption = {
      imgURL: itemIcons + 'Feet_01.png',
      text: 'Stand 1',
      appearance: {
        colorChoices: blackAndWhite,
        model: {
          name: 'Stand 1',
          modelPieces: [
            'Feet_SteelFrame_01'
          ],
          partsStyled: [
            'polySurface6',
            'polySurface7'
          ],
          gridsProvided: [
            {
              hCount: 3,
              vCount: 3,
              center: {
                x: 0,
                y: 0.36,
                z: 0
              }
            }
          ]
        }
      }
    };

    const feetStand2: CustomizerOption = {
      imgURL: itemIcons + 'Feet_02.png',
      text: 'Stand 2',
      appearance: {
        colorChoices: blackAndWhite,
        model: {
          name: 'Stand 2',
          modelPieces: [
            'Feet_SteelFrame_02'
          ],
          partsStyled: [
            'polySurface6',
            'polySurface7'
          ],
          gridsProvided: [
            {
              hCount: 6,
              vCount: 3,
              center: {
                x: 0,
                y: 0.36,
                z: 0
              }
            }
          ]
        }
      }
    };

    const feetStand3: CustomizerOption = {
      imgURL: itemIcons + 'Feet_03.png',
      text: 'Stand 3',
      appearance: {
        colorChoices: blackAndWhite,
        model: {
          name: 'Stand 3',
          modelPieces: [
            'Feet_SteelFrame_03'
          ],
          partsStyled: [
            'polySurface6',
            'polySurface7'
          ],
          gridsProvided: [
            {
              hCount: 3,
              vCount: 3,
              center: {
                x: 0,
                y: 0.67,
                z: 0
              }
            }
          ]
        }
      }
    };

    const feetStand4: CustomizerOption = {
      imgURL: itemIcons + 'Feet_04.png',
      text: 'Stand 4',
      appearance: {
        model: {
          name: 'Stand 4',
          modelPieces: [
            'Feet_Wood_01'
          ],
          baseAnchors: [
            {
              x: -0.18,
              y: 0.38,
              z: 0
            },
            {
              x: 0.18,
              y: 0.38,
              z: 0
            }
          ]
        }
      }
    };

    const feetStyleSection: CustomizerSection = {
      imgURL: '',
      name: 'Feet',
      foundation: true,
      pieces: [
        {
          type: 'text',
          text: 'Stand'
        },
        {
          type: 'optionGroup',
          options: [
            feetStand1,
            feetStand2,
            feetStand3,
            feetStand4
          ]
        }
      ]
    };

    const feetTab: CustomizerTab = {
      imgURL: tabIcons + 'Feet_02.png',
      name: 'Feet',
      sections: [
        feetStyleSection
      ]
    };

    const baseGrid: GridDefinition = {
      hCount: 3,
      vCount: 3,
      center: {
        x: 0,
        y: 0,
        z: 0
      }
    };

    const baseStyleParts = [
      'back',
      'base_01',
      'base_02',
      'base_03',
      'base_04'
    ];

    const baseProvidedGrid: GridDefinition = {
      hCount: 3,
      vCount: 3,
      center: {
        x: 0,
        y: 0.37,
        z: 0
      }
    };

    const baseNoDrawers: CustomizerOption = {
      imgURL: 'assets/img/item-icons/Drawer_01.png',
      text: 'No Door',
      appearance: {
        colorChoices: blackWhiteGrey,
        model: {
          name: 'BaseNoDrawers',
          modelPieces: [
            'Base'
          ],
          partsStyled: baseStyleParts,
          gridPatternRequired: [
            baseGrid
          ],
          gridsProvided: [baseProvidedGrid],
          canUseBaseAnchor: true
        }
      }
    };

    const baseOneDrawer: CustomizerOption = {
      imgURL: 'assets/img/item-icons/Drawer_02.png',
      text: 'With Door',
      appearance: {
        colorChoices: blackWhiteGrey,
        model: {
          name: 'BaseOneDrawer',
          modelPieces: [
            'Base',
            'Base_Door_01'
          ],
          partsStyled: baseStyleParts.concat(['door']),
          gridPatternRequired: [
            baseGrid
          ],
          gridsProvided: [baseProvidedGrid],
          canUseBaseAnchor: true
        }
      }
    };

    const baseTwoDrawers: CustomizerOption = {
      imgURL: 'assets/img/item-icons/Drawer_03.png',
      text: 'Two Drawers',
      appearance: {
        colorChoices: blackWhiteGrey,
        model: {
          name: 'BaseTwoDrawers',
          modelPieces: [
            'Base',
            'Base_Door_02'
          ],
          partsStyled: baseStyleParts.concat(['door_02', 'door_03']),
          gridPatternRequired: [
            baseGrid
          ],
          gridsProvided: [baseProvidedGrid],
          canUseBaseAnchor: true
        }
      }
    };

    const baseStyleSection: CustomizerSection = {
      imgURL: '',
      name: 'Style',
      pieces: [
        {
          type: 'optionGroup',
          options: [
            baseNoDrawers,
            baseOneDrawer,
            baseTwoDrawers
          ]
        }
      ]
    };

    const baseTab: CustomizerTab = {
      imgURL: tabIcons + 'Base_02.png',
      name: 'Base',
      sections: [
        baseStyleSection
      ]
    };

    const plateGrid: GridDefinition = {
      hCount: 1,
      vCount: 1,
      center: {
        x: 0,
        y: 0,
        z: 0
      }
    };

    const plateScaling: ScalingDetails = {
      originalSize: {
        x: 12,
        y: 12,
        z: 1.5
      },
      constantEdgeSize: {
        x: 0.6,
        y: 0.6,
        z: 0
      }
    };

    const plateSizes: SizeDefinition = {
      height: 1.5,
      areas: [
        {
          width: 12,
          depth: 12
        },
        {
          width: 24,
          depth: 12
        },
        {
          width: 36,
          depth: 12
        },
        {
          width: 24,
          depth: 24
        },
        {
          width: 36,
          depth: 24
        },
        {
          width: 36,
          depth: 36,
        },
        {
          width: 36,
          depth: 48
        },
        {
          width: 36,
          depth: 72
        }
      ]
    };

    const paintedPlate: CustomizerOption = {
      imgURL: itemIcons + 'paint.png',
      text: 'Paint',
      appearance: {
        colorChoices: boxColors,
        sizes: [plateSizes],
        model: {
          name: 'PaintedPlate',
          modelPieces: ['Plate'],
          partsStyled: ['pCube1'],
          materialReplacements: [
            {
              newMaterialName: 'Painted',
              oldMaterialNames: ['initialShadingGroup']
            }
          ],
          gridPatternRequired: [plateGrid],
          scaling: plateScaling
        }
      }
    };

    const oakPlate: CustomizerOption = {
      imgURL: itemIcons + 'Wood.png',
      text: 'Oak',
      appearance: {
        sizes: [plateSizes],
        model: {
          name: 'OakPlate',
          modelPieces: ['Plate'],
          partsStyled: ['pCube1'],
          materialReplacements: [
            {
              newMaterialName: 'FrameWood',
              oldMaterialNames: ['initialShadingGroup']
            }
          ],
          gridPatternRequired: [plateGrid],
          scaling: plateScaling
        }
      }
    };

    const plateStyleSection: CustomizerSection = {
      imgURL: '',
      name: 'Material',
      pieces: [
        {
          type: 'optionGroup',
          options: [
            paintedPlate,
            oakPlate
          ]
        }
      ]
    };

    const plateTab: CustomizerTab = {
      imgURL: tabIcons + 'Plate_02.png',
      name: 'Plate',
      sections: [
        plateStyleSection
      ]
    };

    const boxTrayScaling: ScalingDetails = {
      originalSize: {
        x: 12,
        y: 12,
        z: 4.2
      },
      constantEdgeSize: {
        x: 0.75,
        y: 0.75,
        z: 0.75
      }
    };

    const paintedBox4CM: SizeDefinition = {
      height: 4.2,
      areas: [
        {
          width: 12,
          depth: 12
        },
        {
          width: 24,
          depth: 12
        }
      ]
    };

    const paintedBox6CM: SizeDefinition = {
      height: 6,
      areas: [
        {
          width: 12,
          depth: 12
        },
        {
          width: 24,
          depth: 12
        },
        {
          width: 24,
          depth: 24
        }
      ]
    };

    const paintedBox9CM: SizeDefinition = {
      height: 9,
      areas: [
        {
          width: 12,
          depth: 12
        },
        {
          width: 24,
          depth: 12
        },
        {
          width: 24,
          depth: 24
        },
        {
          width: 36,
          depth: 12
        }
      ]
    };

    const paintedBox12CM: SizeDefinition = {
      height: 12,
      areas: [
        {
          width: 12,
          depth: 12
        }
      ]
    };

    const boxGrid = {
      hCount: 1,
      vCount: 1,
      center: {
        x: 0,
        y: 0,
        z: 0
      }
    };

    const paintedBox: CustomizerOption = {
      imgURL: itemIcons + 'paint.png',
      text: 'Paint',
      appearance: {
        colorChoices: boxColors,
        sizes: [
          paintedBox4CM,
          paintedBox6CM,
          paintedBox9CM,
          paintedBox12CM
        ],
        model: {
          name: 'PaintedBox',
          modelPieces: ['Box_03'],
          partsStyled: ['polySurface9'],
          materialReplacements: [
            {
              newMaterialName: 'Painted',
              oldMaterialNames: ['lambert1']
            }
          ],
          gridPatternRequired: [boxGrid],
          scaling: boxTrayScaling
        }
      }
    };

    const oakBox3CM: SizeDefinition = {
      height: 3,
      areas: [
        {
          width: 12,
          depth: 12
        }
      ]
    };

    const oakBox6CM: SizeDefinition = {
      height: 6,
      areas: [
        {
          width: 12,
          depth: 12
        },
        {
          width: 24,
          depth: 12
        }
      ]
    };

    const oakBox9CM: SizeDefinition = {
      height: 9,
      areas: [
        {
          width: 12,
          depth: 12
        },
        {
          width: 24,
          depth: 12
        },
        {
          width: 24,
          depth: 24
        },
        {
          width: 36,
          depth: 12
        }
      ]
    };

    const oakBox12CM: SizeDefinition = {
      height: 12,
      areas: [
        {
          width: 12,
          depth: 12
        },
        {
          width: 24,
          depth: 12
        },
        {
          width: 24,
          depth: 24
        },
        {
          width: 36,
          depth: 12
        }
      ]
    };

    const oakBox: CustomizerOption = {
      imgURL: itemIcons + 'Wood.png',
      text: 'Oak',
      appearance: {
        sizes: [
          oakBox3CM,
          oakBox6CM,
          oakBox9CM,
          oakBox12CM
        ],
        model: {
          name: 'OakBox',
          modelPieces: ['Box_03'],
          partsStyled: ['polySurface9'],
          materialReplacements: [
            {
              newMaterialName: 'FrameWood',
              oldMaterialNames: ['lambert1']
            }
          ],
          gridPatternRequired: [boxGrid],
          scaling: boxTrayScaling
        }
      }
    };

    const boxMaterialSection: CustomizerSection = {
      imgURL: '',
      name: 'Material',
      pieces: [
        {
          type: 'optionGroup',
          options: [
            paintedBox,
            oakBox
          ]
        }
      ]
    };

    const boxTab: CustomizerTab = {
      imgURL: tabIcons + 'Box_02.png',
      name: 'Box',
      sections: [
        boxMaterialSection
      ]
    };

    const paintedTray4CM: SizeDefinition = {
      height: 4.2,
      areas: [
        {
          width: 24,
          depth: 24
        },
        {
          width: 36,
          depth: 12
        }
      ]
    };

    const paintedTray6CM: SizeDefinition = {
      height: 6,
      areas: [
        {
          width: 36,
          depth: 12
        },
        {
          width: 36,
          depth: 24
        },
        {
          width: 36,
          depth: 36
        }
      ]
    };

    const paintedTray: CustomizerOption = {
      imgURL: itemIcons + 'paint.png',
      text: 'Paint',
      appearance: {
        colorChoices: boxColors,
        sizes: [
          paintedTray4CM,
          paintedTray6CM
        ],
        model: {
          name: 'PaintedTray',
          modelPieces: ['Box_03'],
          partsStyled: ['polySurface9'],
          materialReplacements: [
            {
              newMaterialName: 'Painted',
              oldMaterialNames: ['lambert1']
            }
          ],
          gridPatternRequired: [boxGrid],
          scaling: boxTrayScaling
        }
      }
    };

    const oakTray3CM: SizeDefinition = {
      height: 3,
      areas: [
        {
          width: 24,
          depth: 12
        },
        {
          width: 24,
          depth: 24
        },
        {
          width: 36,
          depth: 12
        },
        {
          width: 36,
          depth: 24
        },
        {
          width: 36,
          depth: 36
        }
      ]
    };

    const oakTray6CM: SizeDefinition = {
      height: 6,
      areas: [
        {
          width: 24,
          depth: 24
        },
        {
          width: 36,
          depth: 12
        },
        {
          width: 36,
          depth: 24
        },
        {
          width: 36,
          depth: 36
        }
      ]
    };

    const oakTray: CustomizerOption = {
      imgURL: itemIcons + 'Wood.png',
      text: 'Oak',
      appearance: {
        sizes: [
          oakTray3CM,
          oakTray6CM
        ],
        model: {
          name: 'OakTray',
          modelPieces: ['Box_03'],
          partsStyled: ['polySurface9'],
          materialReplacements: [
            {
              newMaterialName: 'FrameWood',
              oldMaterialNames: ['lambert1']
            }
          ],
          gridPatternRequired: [boxGrid],
          scaling: boxTrayScaling
        }
      }
    };

    const trayMaterialSection: CustomizerSection = {
      imgURL: '',
      name: 'Material',
      pieces: [
        {
          type: 'optionGroup',
          options: [
            paintedTray,
            oakTray
          ]
        }
      ]
    };

    const trayTab: CustomizerTab = {
      imgURL: tabIcons + 'Tray_02.png',
      name: 'Tray',
      sections: [
        trayMaterialSection
      ]
    };

    const scene: Model = {
      name: 'mainScene',
      root: modelsDir + 'Scene/',
      file: 'Scene.gltf',
      materialReplacements: [
        {
          newMaterialName: 'GrayFloor',
          oldMaterialNames: ['wood_floor']
        }
      ]
    };

    return {
      environment: images + 'env/graySpecularHDR.dds',
      scene: scene,
      allMaterials: materials,
      allModelPieces: modelPieces,
      tabs: [
        feetTab,
        baseTab,
        plateTab,
        boxTab,
        trayTab
      ]
    };
  }

  constructor(private http: HttpClient) { }

  getAppearanceConfiguration(): Observable<AppearanceConfig> {
    return this.http.get<AppearanceConfig>(window['modularStorageConfigURL']);
  }
}
