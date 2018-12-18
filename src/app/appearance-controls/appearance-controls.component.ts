import {Component, OnDestroy, ViewChild} from '@angular/core';
import {CustomizerDataService} from '../customizer-data.service';
import {ViewerService} from '../viewer.service';
import {Subscription} from 'rxjs';
import {UndoMgr} from './undo-manager';
import {
    AppearanceOption,
    AppearanceOptionGroup,
    AppearanceSection,
    MaterialProperties,
    WeaponCustomization,
    WeaponCustomizationData
} from '../customizer-data-types';

export interface DeepActiveAppearanceTracking {
    activeSection: AppearanceSection;
    resetActive: boolean;
    chosenGroupOption: Map<AppearanceOptionGroup, AppearanceOption>;
}

@Component({
    selector: 'app-appearance-controls',
    templateUrl: './appearance-controls.component.html',
    styleUrls: ['./appearance-controls.component.css']
})
export class AppearanceControlsComponent implements OnDestroy {
    @ViewChild('optionsContainer')
    public optionsContainer;

    public allSections: AppearanceSection[] = [];
    public chosenWeapon: WeaponCustomization;
    public customizationData: WeaponCustomizationData;
    public hideWeaponChoices = true;
    public selectedItems: Map<WeaponCustomization, DeepActiveAppearanceTracking> =
        new Map<WeaponCustomization, DeepActiveAppearanceTracking>();

    private clickSubscription: Subscription;
    private initializeSubscription: Subscription;
    private viewerResetSubscription: Subscription;
    private lastClickedOption: Map<AppearanceSection, AppearanceOption> = new Map<AppearanceSection, AppearanceOption>();

    constructor(private customizerDataService: CustomizerDataService, private viewerService: ViewerService) {
        this.initializeSubscription = viewerService.initialized.subscribe(() => {
            this.viewerInitialized();
        });

        this.clickSubscription = this.viewerService.meshClicked.subscribe((meshName: string) => {
            this.meshClicked(meshName);
        });

        this.viewerResetSubscription = this.viewerService.reset.subscribe(() => {
            this.viewerReset();
        });
    }

    undoManagerLimit() {
        return UndoMgr.getInstance().getIndex() + 1;
    }

    activeSection(): AppearanceSection {
        return this.activeTracking().activeSection;
    }

    activeTracking(): DeepActiveAppearanceTracking {
        return this.selectedItems.get(this.chosenWeapon);
    }

    changeSection(event: MouseEvent, section: AppearanceSection) {
        this.activeTracking().activeSection = section;

        return this.stopEvent(event);
    }


    /**
     * @param {string} meshName
     */
    chooseWeapon(event: MouseEvent, weapon: WeaponCustomization) {

        UndoMgr.getInstance().clear();
        this.chosenWeapon = weapon;
        this.hideWeaponChoices = true;
        this.allSections = this.customizationData.commonSections.slice()
            .concat(this.chosenWeapon.customizations.slice());

        this.viewerService.viewer.changeWeapon(weapon.modelFolder, weapon.modelFile, weapon.preview);

        return this.stopEvent(event);
    }

    clampScrollValue(scroll: number) {
        const ne: HTMLDivElement = this.optionsContainer.nativeElement;

        return Math.max(0, Math.min(scroll, ne.scrollWidth - ne.clientWidth));
    }


    /**
     *  @param {string} meshName
     */
    meshClicked(meshName: string) {
        // if (meshName === 'assets/models/assault-rifle/assault-rifle.gltf.honey_badger.trigger') return;
        if (meshName.includes('trigger')) return;
        if (!this.chosenWeapon.interactionBlacklist || (this.chosenWeapon.interactionBlacklist.indexOf(meshName) === -1)) {
            const activeSection = this.activeSection();

            /* if (activeTracking.resetActive) {
               switch (activeSection.interactionType) {
                 case 'alterMaterial':
                   this.viewerService.viewer.resetMaterialProperty(meshName, activeSection.affectedParameter);
                   break;
                 case 'swapMaterial':
                   this.viewerService.viewer.resetMaterial(meshName);
                   break;
               }
             } else {
             */
            const lastClickedOption = this.lastClickedOption.has(activeSection) ? this.lastClickedOption.get(activeSection) : null;

            if (lastClickedOption) {
                switch (activeSection.interactionType) {
                    case 'alterMaterial':
                        UndoMgr.setMaterialProperty(this.viewerService.viewer, meshName,
                            activeSection.affectedParameter, lastClickedOption.interactionValue);
                        // this.viewerService.viewer.setMeshMaterialProperty(meshName, activeSection.affectedParameter,
                        //  lastClickedOption.interactionValue);
                        break;
                    case 'swapMaterial':
                        // this.viewerService.viewer.changeMeshMaterial(meshName, lastClickedOption.interactionValue);
                        UndoMgr.setMaterialTexture(this.viewerService.viewer, meshName, lastClickedOption.interactionValue);
                        break;
                }
            }
        }
        // }
    }

    ngOnDestroy() {
        this.initializeSubscription.unsubscribe();
        this.clickSubscription.unsubscribe();
        this.viewerResetSubscription.unsubscribe();
    }

    /**
     * @param {string} meshName
     */
    optionClicked(event: MouseEvent, optionGroup: AppearanceOptionGroup, option: AppearanceOption) {
        const currentlySelectedOption = this.selectedOption(optionGroup);
        const activeTracking = this.activeTracking();
        activeTracking.resetActive = false;

        const prevChosenGroupOption = activeTracking.chosenGroupOption;

        const lastClickedOption = this.lastClickedOption;

        // keep a handle to previous values
        const prevOption = lastClickedOption.get(this.activeSection());
        const prevGroupOption = prevChosenGroupOption.get(optionGroup);
        const section = this.activeSection();

        if (option === currentlySelectedOption) {

            if (optionGroup.allowNone) {

                const redoFunction = () => {
                    this.optionOff(option);
                    prevChosenGroupOption.set(optionGroup, null);
                    lastClickedOption.set(section, null);

                };
                if (section.interactionType == 'toggleMesh') {

                    UndoMgr.add({
                        undo: () => {
                            this.optionOn(option);
                            prevChosenGroupOption.set(optionGroup, prevGroupOption);
                            lastClickedOption.set(section, prevOption);
                        },
                        redo: redoFunction,
                    });
                } else {
                    redoFunction();
                }


            }
        } else {

            const redoFunction = () => {
                this.optionOff(currentlySelectedOption);
                prevChosenGroupOption.set(optionGroup, option);
                this.optionOn(option);
                lastClickedOption.set(section, option);
            };
            if (section.interactionType == 'toggleMesh') {

                UndoMgr.add({
                    undo: () => {
                        this.optionOff(option, section);
                        prevChosenGroupOption.set(optionGroup, prevGroupOption);
                        this.optionOn(currentlySelectedOption, section);
                        lastClickedOption.set(section, prevOption);

                    },
                    redo: redoFunction,
                });
            } else {
                redoFunction();
            }
        }

        return this.stopEvent(event);
    }

    optionOff(option: AppearanceOption, section?: AppearanceSection) {
        if (!option) {
            return;
        }

        section = section ? section : this.activeSection();

        switch (section.interactionType) {
            case 'toggleMesh':
                this.viewerService.viewer.hideMesh(option.interactionValue);
                if (option.include) {
                    let hideIncludedMesh = true;
                    section.optionGroups.forEach((optionGroup) => {
                        const selectedOption = this.selectedOption(optionGroup);
                        if (!selectedOption) return;
                        if (!selectedOption.include) return;
                        if (selectedOption.name === option.name) return;
                        if (selectedOption.include !== option.include) return;
                        hideIncludedMesh = false;
                    });
                    if (hideIncludedMesh) {
                        this.viewerService.viewer.hideMesh(option.include);
                    }
                }
                if (option.exclude) {
                    option.exclude.forEach((obj) => {
                        this.viewerService.viewer.showMesh(obj);
                    });
                }
                break;
        }
    }

    optionOn(option: AppearanceOption, section?: AppearanceSection) {
        if (!option) {
            return;
        }
        section = section ? section : this.activeSection();
        switch (section.interactionType) {
            case 'toggleMesh':
                this.viewerService.viewer.showMesh(option.interactionValue);
                if (option.include) {
                    this.viewerService.viewer.showMesh(option.include);
                }
                if (option.exclude) {
                    option.exclude.forEach((obj) => {
                        this.viewerService.viewer.hideMesh(obj);
                    });
                    
                }
                if (option.ajustment) {
                    option.ajustment.forEach((obj) => {
                        this.viewerService.viewer.setPosition(obj.interactionValue, obj.position);
                    });
                }
                section.optionGroups.forEach((optionGroup) => {
                    const selectedOption = this.selectedOption(optionGroup);
                    if (selectedOption) {
                        if (selectedOption.ajustment) {
                            selectedOption.ajustment.forEach((obj) => {
                                if (obj.interactionValue === option.interactionValue) {
                                    this.viewerService.viewer.setPosition(obj.interactionValue, obj.position);
                                }
                            });

                        }
                    }
                });
                break;
        }
    }

    resetPressed(event) {
        // const tracking = this.activeTracking();

        // tracking.resetActive = !tracking.resetActive;
        UndoMgr.undo();
        return this.stopEvent(event);
    }

    redoPressed(event) {
        UndoMgr.redo();
        return this.stopEvent(event);
    }

    scrollOptionsLeft(event) {
        const ne: HTMLDivElement = this.optionsContainer.nativeElement;

        ne.scrollLeft = this.clampScrollValue(ne.scrollLeft - (ne.clientWidth - 64));

        return this.stopEvent(event);
    }

    scrollOptionsRight(event) {
        const ne: HTMLDivElement = this.optionsContainer.nativeElement;

        ne.scrollLeft = this.clampScrollValue(ne.scrollLeft + (ne.clientWidth - 64));

        return this.stopEvent(event);
    }

    selectedOption(optionGroup: AppearanceOptionGroup): AppearanceOption {
        return this.activeTracking().chosenGroupOption.get(optionGroup);
    }

    setupOptionTracking(commonSections: AppearanceSection[], weapon: WeaponCustomization) {
        const groupOptionTracking = new Map<AppearanceOptionGroup, AppearanceOption>();

        commonSections.slice()
            .concat(weapon.customizations.slice())
            .forEach(function (customization) {
                customization.optionGroups.forEach(function (optionGroup) {
                    let defaultSelected: AppearanceOption = null;

                    if (typeof optionGroup.defaultSelected === 'number') {
                        defaultSelected = optionGroup.options[optionGroup.defaultSelected];
                    } else if (!optionGroup.allowNone && (optionGroup.options.length > 0)) {
                        defaultSelected = optionGroup.options[0];
                    }

                    groupOptionTracking.set(optionGroup, defaultSelected);
                });
            });

        this.selectedItems.set(weapon, {
            activeSection: (commonSections.length !== 0) ? commonSections[0] : weapon.customizations[0],
            resetActive: false,
            chosenGroupOption: groupOptionTracking
        });
    }

    stopEvent(event: MouseEvent) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        return false;
    }

    toggleChoices(event: MouseEvent) {
        this.hideWeaponChoices = !this.hideWeaponChoices;

        return this.stopEvent(event);
    }

    viewerInitialized() {
        const createMaterial = (matProps: MaterialProperties) => {
            this.viewerService.viewer.createMaterial(matProps);
        };

        this.customizerDataService.weaponsData().subscribe((customizationData) => {
            this.customizationData = customizationData;

            if (!!customizationData.environment) {
                this.viewerService.viewer.setEnvironment(customizationData.environment);
            }

            if (!!customizationData.commonMaterials) {
                customizationData.commonMaterials.forEach(createMaterial);
            }

            //  customizationData.weapons= [customizationData.weapons[0]]

            customizationData.weapons.forEach((weapon, wIdx) => {
                this.setupOptionTracking(customizationData.commonSections || [], weapon);

                this.viewerService.viewer.load(weapon.modelFolder, weapon.modelFile, wIdx === 0, () => {
                    this.weaponSetup(weapon);
                });

                if (!!weapon.materials) {
                    weapon.materials.forEach(createMaterial);
                }

            });

            this.chooseWeapon(null, customizationData.weapons[0]);
        });
    }

    viewerReset() {
        this.customizationData.weapons.forEach((weapon) => {
            this.setupOptionTracking(this.customizationData.commonSections || [], weapon);

            this.weaponSetup(weapon);
        });
    }

    weaponSetup(object: WeaponCustomization) {
        if (!!object.replaceMaterials) {
            object.replaceMaterials.forEach((replacement) => {
                //console.log('reset-part', replacement);
                this.viewerService.viewer.replaceMaterials(object.modelFolder, object.modelFile,
                    replacement.oldMaterialNames, replacement.newMaterialName);
            });
        }


        if (object.rotation) {
            this.viewerService.viewer.setRotation(object.modelFolder, object.modelFile, object.rotation);
        }

        if (object.scale) {
            this.viewerService.viewer.setScale(object.modelFolder, object.modelFile, object.scale);
        }

        if (object.position) {
            this.viewerService.viewer.setPosition3(object.modelFolder, object.modelFile, object.position);
        }

        if (object.faces) {
            object.faces.forEach((face)=>{
                this.viewerService.viewer.setFace(object, face);
            })
        }

        if (!!object.setupActions) {
            object.setupActions.forEach((setupAction) => {
                switch (setupAction.type) {
                    case 'hideMesh':
                        this.viewerService.viewer.hideMesh(setupAction.target, object.modelFolder, object.modelFile);
                        break;
                    case 'showMesh':
                        object.customizations[0].optionGroups.forEach((optionGroup) => {
                            optionGroup.options.forEach((option) => {
                                if (setupAction.target === option.name) {
                                    this.optionOn(option);
                                    this.selectedItems.get(object).chosenGroupOption.set(optionGroup, option);
                                }
                            });
                        });
                        break;
                }
            });
        }
    }
}
