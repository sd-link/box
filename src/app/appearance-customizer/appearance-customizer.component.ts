import {Component, OnInit, ViewChild} from '@angular/core';
import {
  AppearanceConfig,
  AppearanceDataService, AreaDefinition,
  CustomizerOption,
  CustomizerSection,
  CustomizerTab, FurnitureObject,
  SizeDefinition
} from '../appearance-data.service';
import { ViewerBindingService } from '../viewer-binding.service';
import {TabsetComponent} from 'ngx-bootstrap';

interface ColorTracking {
  colors: string[];
  activeColor: string;
}

interface SizeTracking {
  sizes: SizeDefinition[];
  chosenHeight: number;
  chosenArea: number;
}

class SelectionTracking {
  public colorTracking: ColorTracking;
  public sizeTracking: SizeTracking;
  public selectedOption: Map<CustomizerSection, CustomizerOption>;
  public lastClickedOption: CustomizerOption;
  public lastActiveSection: CustomizerSection;

  constructor() {
    this.reset();
  }

  apply(other: SelectionTracking) {
    this.colorTracking = other.colorTracking;
    this.sizeTracking = other.sizeTracking;
    this.selectedOption = other.selectedOption;
    this.lastActiveSection = other.lastActiveSection;
    this.lastClickedOption = other.lastClickedOption;
  }

  clone(): SelectionTracking {
    const ret = new SelectionTracking();

    ret.apply(this);

    return ret;
  }

  reset() {
    this.colorTracking = {colors: [], activeColor: ''};
    this.sizeTracking = {sizes: [], chosenHeight: 0, chosenArea: 0};
    this.selectedOption = new Map<CustomizerSection, CustomizerOption>();
    this.lastClickedOption = null;
    this.lastActiveSection = null;
  }
}

interface SelectionData {
  tab: CustomizerTab;
  tracking: SelectionTracking;
}

@Component({
  selector: 'app-appearance-customizer',
  templateUrl: './appearance-customizer.component.html',
  styleUrls: ['./appearance-customizer.component.css']
})
export class AppearanceCustomizerComponent implements OnInit {
  @ViewChild('appearanceTabs')
  appearanceTabs: TabsetComponent;

  public appearanceData: AppearanceConfig = null;

  private changingTabManually = false;
  private currentTab: CustomizerTab = null;
  private selectionTracking: Map<CustomizerTab, SelectionTracking> = new Map<CustomizerTab, SelectionTracking>();

  static TabHasFoundation(tab: CustomizerTab): boolean {
    return tab.sections.some(function (sect) { return sect.foundation; });
  }


  constructor(private appearanceDataService: AppearanceDataService, private viewerBindingService: ViewerBindingService) {
    this.viewerBindingService.initialized.subscribe(() => {
      appearanceDataService.getAppearanceConfiguration()
        .subscribe((data: AppearanceConfig) => {
          this.appearanceData = data;
          this.currentTab = data.tabs[0];

          if (!!data.environment) {
            this.viewerBindingService.viewer.setEnvironment(data.environment);
          }

          if (!!data.allMaterials) {
            data.allMaterials.forEach((matProps) => {
              this.viewerBindingService.viewer.createMaterial(matProps);
            });
          }

          if (!!data.scene) {
            this.viewerBindingService.viewer.setScene(data.scene);
          }

          data.allModelPieces.forEach((piece) => {
            this.viewerBindingService.viewer.loadPiece(piece);
          });

          data.tabs.forEach((tab) => {
            const tabMap = new Map<string, CustomizerOption>();

            tab.sections.forEach((section) => {
              tabMap[section.name] = null;
            });

            this.selectionTracking.set(tab, new SelectionTracking());
          });
        });
    });

    this.viewerBindingService.modelSelectionChanged.subscribe((data) => {
      this.modelSelectionChanged(data);
    });
  }

  ngOnInit() {
  }

  areaChosen() {
    const tabTracking = this.tabTracking();
    const sizeTracking: SizeTracking = tabTracking.sizeTracking;
    const chosenHeight: SizeDefinition = sizeTracking.sizes[sizeTracking.chosenHeight];
    const chosenArea: AreaDefinition = chosenHeight.areas[sizeTracking.chosenArea];
    const sourceModelInfo: FurnitureObject = tabTracking.lastClickedOption.appearance.model;
    const modelInfo: FurnitureObject = {
      name: sourceModelInfo.name,
      modelPieces: sourceModelInfo.modelPieces,
      partsStyled: sourceModelInfo.partsStyled,
      materialReplacements: sourceModelInfo.materialReplacements,
      gridsProvided: sourceModelInfo.gridsProvided,
      baseAnchors: sourceModelInfo.baseAnchors,
      gridPatternRequired: [{
        hCount: chosenArea.width / 12,
        vCount: chosenArea.depth / 12,
        center: sourceModelInfo.gridPatternRequired[0].center
      }],
      canUseBaseAnchor: sourceModelInfo.canUseBaseAnchor,
      scaling: {
        originalSize: sourceModelInfo.scaling.originalSize,
        constantEdgeSize: sourceModelInfo.scaling.constantEdgeSize,
        scale: {
          x: chosenArea.width,
          y: chosenArea.depth,
          z: chosenHeight.height
        }
      }
    };
    const data: SelectionData = {
      tab: this.currentTab,
      tracking: tabTracking.clone()
    };

    if (this.viewerBindingService.viewer.startPlacing(modelInfo, data)) {
      this.colorSelected(tabTracking.colorTracking.activeColor);
    }
  }

  colorSelected(color: string) {
    this.colorTracking().activeColor = color;

    this.viewerBindingService.viewer.changeSelectedColor(color);
  }

  colorTracking(): ColorTracking {
    return this.tabTracking().colorTracking;
  }

  getSizeTracking(): SizeTracking {
    return this.tabTracking().sizeTracking;
  }

  heightChosen() {
    this.getSizeTracking().chosenArea = 0;
    this.areaChosen();
  }

  modelSelectionChanged(data: SelectionData) {
    if (data) {
      this.changingTabManually = true;
      this.appearanceTabs.tabs[this.appearanceData.tabs.indexOf(data.tab)].active = true;
      this.changingTabManually = false;

      this.tabTracking().apply(data.tracking);
    } else {
      this.tabTracking().reset();
    }
  }

  optionClicked(section: CustomizerSection, option: CustomizerOption) {
    const tabTracking = this.tabTracking();

    if (tabTracking.lastClickedOption === option) {
      return;
    }

    tabTracking.lastClickedOption = option;
    tabTracking.lastActiveSection = section;
    tabTracking.selectedOption.set(section, option);

    const colorTracking: ColorTracking = tabTracking.colorTracking;

    const sizeTracking: SizeTracking = this.getSizeTracking();
    sizeTracking.chosenHeight = 0;
    sizeTracking.chosenArea = 0;

    if (!!option.appearance) {
      const appearance = option.appearance;
      colorTracking.colors = appearance.colorChoices || [];
      sizeTracking.sizes = appearance.sizes || [];

      const data: SelectionData = {
        tab: this.currentTab,
        tracking: tabTracking.clone()
      };

      if (section.foundation) {
        this.viewerBindingService.viewer.setFoundation(appearance.model, data);
      } else if (sizeTracking.sizes.length !== 0) {
        this.heightChosen();
      } else {
        this.viewerBindingService.viewer.startPlacing(appearance.model, data);
      }

      if (colorTracking.colors.length > 0) {
        this.colorSelected(colorTracking.colors[0]);
      } else {
        this.colorSelected('#ffffff');
      }
    } else if (section.foundation) {
      this.viewerBindingService.viewer.setFoundation(null, null);
    }
  }

  selectedOption(section: CustomizerSection): CustomizerOption {
    return this.tabTracking().selectedOption.get(section);
  }

  tabChanged(tab: CustomizerTab) {
    this.tabTracking().reset();

    this.currentTab = tab;

    if (this.changingTabManually) {
      return;
    }

    this.viewerBindingService.viewer.deselect();

    if (AppearanceCustomizerComponent.TabHasFoundation(tab)) {
      this.viewerBindingService.viewer.selectFoundation();
    }
  }

  tabDisabled(tab: CustomizerTab): boolean {
    if (!this.viewerBindingService || !this.viewerBindingService.viewer) {
      return true;
    }

    if (AppearanceCustomizerComponent.TabHasFoundation(tab)) {
      return false;
    }

    let enabled = this.viewerBindingService.viewer.haveGrids();
    const canUseAnchors = tab.sections ? tab.sections.some(function (s) {
      return s.pieces ? s.pieces.some(function (p) {
        return p.options ? p.options.some(function (o) {
          return (o.appearance && o.appearance.model) ? o.appearance.model.canUseBaseAnchor : false;
        }) : false;
      }) : false;
    }) : false;

    if (canUseAnchors) {
      enabled = enabled || this.viewerBindingService.viewer.haveAnchors();
    }

    return !enabled;
  }

  tabTracking(): SelectionTracking {
    return this.selectionTracking.get(this.currentTab);
  }
}
