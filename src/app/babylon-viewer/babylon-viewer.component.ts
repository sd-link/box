/// <reference path="../../babylon.d.ts"/>
/// <reference path="../../babylon.gui.d.ts"/>
import { Component, AfterContentInit, ViewChild, OnDestroy } from '@angular/core';
import { ViewerBindingService } from '../viewer-binding.service';
import {CartesianTriple, FurnitureObject, GridDefinition, MaterialProperties, Model} from '../appearance-data.service';
import {GridFillTracking} from './GridFillTracking';
import {InteractionEventService} from '../interaction-event.service';
import {Subscription} from 'rxjs';
import {GridPlot} from './GridPlot';
import {HelperTextService} from '../helper-text.service';
import {TranslateService} from '@ngx-translate/core';

const DRAG_HEIGHT_OFFSET = 0.015;

export interface SimpleModelTracking {
  creationData: FurnitureObject;
  name: string;
  color: string;
}

interface AnchorTracking {
  point: BABYLON.Vector3;
  attachedObject?: ModelTracking;
}

interface GridTracking {
  center: BABYLON.Vector3;
  fillTracking: GridFillTracking;
  attachedObjects: ModelTracking[];
}

interface ModelTracking extends SimpleModelTracking {
  parent?: ModelTracking;
  gridParents: ModelTracking[]; // might be placed across multiple grids, so keep track of all parents
  model: BABYLON.Mesh;
  anchors?: AnchorTracking[];
  grids?: GridTracking[];
  pickupAction?: BABYLON.Action;
  selectAction?: BABYLON.Action;
  userData?: any;
}

// For places (grids and anchors) where we can place an object, ordered by how close they are
interface ClosestPlacement {
  model: ModelTracking;
  grid?: GridTracking; // can be placed on a grid
  anchor?: AnchorTracking; // can be placed on an anchor
  distSq?: number; // square of total distance
  distY?: number; // distance in height (Y coordinate)
}

interface GridFillPattern {
  ft: GridFillTracking;
  gp: GridDefinition;
}

interface GridPosition {
  x: number;
  y: number;
}

interface GridRelativeInfo {
  modelLocalH: BABYLON.Vector3;
  modelLocalV: BABYLON.Vector3;
  localOrigin: BABYLON.Vector3;
  closestGridOrigin: BABYLON.Vector3;
}

enum TryPlaceResult {
  Success = 1,
  FailureInvalid,
  FailureNoFreePlace
}

@Component({
  selector: 'app-babylon-viewer',
  templateUrl: './babylon-viewer.component.html',
  styleUrls: ['./babylon-viewer.component.css']
})
export class BabylonViewerComponent implements AfterContentInit, OnDestroy {
  @ViewChild('renderTarget')
  renderCanvas;

  public selectedModel: ModelTracking = null;
  public currentProductImageBase64 = '';
  public helperText = '';
  public helperTextColor = '#000000';

  private displayCanvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;
  private photoCamera: BABYLON.ArcRotateCamera;

  private knownWidth = 0;
  private knownHeight = 0;
  private aspectRatio = 1;
  private leftToLoad = 0;

  private activeModels: ModelTracking[] = [];
  private assembledRoots: Map<string, BABYLON.Mesh> = new Map<string, BABYLON.Mesh>();
  private dragObserver: BABYLON.Observer<BABYLON.PointerInfo> = null;
  private environment: BABYLON.BaseTexture = null;
  private foundation: ModelTracking = null;
  private interfaceTexture: BABYLON.GUI.AdvancedDynamicTexture = null;
  private interfaceNet: BABYLON.GUI.Rectangle = null;
  private interfaceControls: BABYLON.GUI.Rectangle = null;
  private interfaceConfirm: BABYLON.GUI.Rectangle = null;
  private materials: Map<string, BABYLON.PBRMaterial> = new Map<string, BABYLON.PBRMaterial>();
  private modelsWithAnchors: ModelTracking[] = [];
  private modelsWithGrids: ModelTracking[] = [];
  private oldCamRadius = 0;
  private oldCamTarget: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
  private pieceContainers: Map<string, BABYLON.AssetContainer> = new Map<string, BABYLON.AssetContainer>();
  private pieceRoots: Map<string, BABYLON.Mesh> = new Map<string, BABYLON.Mesh>();
  private placing = false;
  private placementSucceeded = true;
  private selectionJustChanged = false;
  private selectionWorldCenter: BABYLON.Vector3 = null;
  private textures: Map<string, BABYLON.Texture> = new Map<string, BABYLON.Texture>();
  private resetSubscription: Subscription;
  private helperTextSubscription: Subscription;

  constructor(private viewerBindingService: ViewerBindingService, private interactionEventService: InteractionEventService,
              private helperTextService: HelperTextService, translate: TranslateService) {   
    this.viewerBindingService.setViewer(this);

    this.resetSubscription = this.interactionEventService.observable('reset').subscribe(() => {
      this.setFoundation(null);
    });

    this.helperTextSubscription = this.helperTextService.helperTextObservable.subscribe((text) => {
      this.setHelperText(text);
    });
    
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');
  }
  
  setHelperText(text: string, color: string = '#000000') {
    this.helperText = text;
    this.helperTextColor = color;
  }

  addToLists(mt: ModelTracking) {
    this.activeModels.push(mt);

    if (mt.grids.length !== 0) {
      this.modelsWithGrids.push(mt);
    }

    if (mt.anchors.length !== 0) {
      this.modelsWithAnchors.push(mt);
    }
  }

  adjustChildren(mt: ModelTracking, amount: BABYLON.Vector3) {
    mt.grids.forEach((grid) => {
      grid.attachedObjects.forEach((go) => {
        go.model.position = go.model.position.add(amount);

        this.adjustChildren(go, amount);
      });
    });

    mt.anchors.forEach((anchor) => {
      if (!!anchor.attachedObject) {
        anchor.attachedObject.model.position = anchor.attachedObject.model.position.add(amount);

        this.adjustChildren(anchor.attachedObject, amount);
      }
    });
  }

  assembleModel(modelName: string, pieces: string[]): BABYLON.Mesh {
    const rootNode = new BABYLON.Mesh(modelName + '-source', this.scene);
    rootNode.setEnabled(false);

    pieces.forEach((pieceName) => {
      const clonedPiece = this.pieceRoots.get(pieceName)
        .clone(modelName + '-' + pieceName, rootNode, false);

      clonedPiece.setEnabled(true);

      clonedPiece.getChildMeshes(false).forEach((cm) => {
        cm.checkCollisions = true;

        if (!!cm.material) {
          cm.material = cm.material.clone(cm.material.name + '-clone');
        }
      });
    });

    this.assembledRoots.set(modelName, rootNode);

    return rootNode.clone(modelName, null, false);
  }

  changeSelectedColor(color: string) {
    if (!color || !this.selectedModel || !this.selectedModel.creationData.partsStyled) {
      return;
    }

    this.selectedModel.color = color;

    this.getStyledMeshes(this.selectedModel).forEach((mesh) => {
      if (mesh.material) {
        let material = (<BABYLON.PBRMaterial>mesh.material);
        let isWood = material.name.toLowerCase().indexOf("wood") >= 0;
        material.albedoTexture= this.texture("assets/img/textures/colors/" + (isWood ? "wood/" : "") + color.substring(1) + ".png");
      } else {
        mesh.getChildren().forEach(mesh => {
          let material = <BABYLON.PBRMaterial>(<BABYLON.AbstractMesh>mesh).material;
          let isWood = material.name.toLowerCase().indexOf("wood") >= 0;
          material.albedoTexture= this.texture("assets/img/textures/colors/" + (isWood ? "wood/" : "") + color.substring(1) + ".png");
        });
      }
    });
  }

  // Returns the placement options ordered by how close they are. If the closest one is an anchor, only that
  // is returned, if the closest ones are grids, all of the them are returned (which are on the same height)
  closestPlacementsOnModel(point: BABYLON.Vector3, mt: ModelTracking, useAnchors: boolean): ClosestPlacement[] {
    const modelMat = mt.model.getWorldMatrix();
    let result: ClosestPlacement[] = [];

    // collect all the grids
    result = result.concat(
      mt.grids.filter(cp => !cp.fillTracking.fullyClaimed() && (cp.fillTracking.maxHeight !== 0)).map(
        function (grid): ClosestPlacement { 
          return { 
            model: mt, 
            grid: grid, 
            distSq: BABYLON.Vector3.DistanceSquared(point, BABYLON.Vector3.TransformCoordinates(grid.center, modelMat)),
            distY: point.y - BABYLON.Vector3.TransformCoordinates(grid.center, modelMat).y
          };
        }
      ));

    // collect all the anchors    
    if (useAnchors) {
      result = result.concat(
        mt.anchors.filter(a => !a.attachedObject).map(
          function (anchor): ClosestPlacement {
            return { 
              model: mt, 
              grid: null, 
              anchor: anchor, 
              distSq: BABYLON.Vector3.DistanceSquared(point, BABYLON.Vector3.TransformCoordinates(anchor.point, modelMat)),
              distY: point.y - BABYLON.Vector3.TransformCoordinates(anchor.point, modelMat).y
            };
          }
        ));    
    }
    
    // order everything (grids and anchors) by distance
    result.sort((a, b) => a.distSq - b.distSq);
    
    if (result.length > 0) {
      // it is not possible to place an object across multiple anchors, so if an anchor is the closest, remove everything else from the result
      if (!!result[0].anchor) {
        // if there are free anchors among the results, choose the first of those, otherwise simply the closest
        result = result.filter(cp=>!!cp.anchor); // remove grids
        // no need to filter free anchors anymore, as we filter them out completely in the current version in the first place
//        let freeAnchors = result.filter(cp=>!cp.anchor.attachedObject);
//        if (freeAnchors.length > 0) {
//          result = freeAnchors;
//        }
        result.length = 1; // only return the first result, cannot place across multiple anchors
      } else {
        // an object can be placed across multiple grids, so if a grid is the closest, keep all the grids that are the same height as the first one
        result = result.filter(cp=>!!cp.grid); // remove anchors
        // no need to filter free grids anymore, as we filter them out completely in the current version in the first place
        // if there are grids which are not fully taken, filter out the fully taken ones, 
        // but if there are none, return the closest fully taken ones, so the user can still move objects around on them (just not finish the placement)
//        let freeGrids = result.filter(cp=>!cp.grid.fillTracking.fullyClaimed());
//        if (freeGrids.length > 0) {
//          result = freeGrids;
//        }
        if (result.length > 1) {
          result = result.filter(cp=>(Math.abs(cp.distY-result[0].distY) < 0.0001)); // remove grids at different heights - we can only place across grids with the same height
                                                                                     // account for floating point error 
        }
      }
    }

    return result;
  }

  // Returns the placement options ordered by how close they are. If the closest one is an anchor, only that
  // is returned, if the closest ones are grids, all of the them are returned (which are on the same height)
  closestPlacementsToPoint(point: BABYLON.Vector3, useAnchors: boolean): ClosestPlacement[] {
    let result: ClosestPlacement[] = [];  
    
    this.modelsWithGrids.forEach(function (model) {
      const modelMat = model.model.getWorldMatrix();
        
      // collect all the grids
      result = result.concat(
        model.grids.filter(cp => !cp.fillTracking.fullyClaimed() && (cp.fillTracking.maxHeight !== 0)).map(
          function (grid): ClosestPlacement {
            return { 
              model: model, 
              grid: grid, 
              distSq: BABYLON.Vector3.DistanceSquared(point, BABYLON.Vector3.TransformCoordinates(grid.center, modelMat)),
              distY: point.y - BABYLON.Vector3.TransformCoordinates(grid.center, modelMat).y
            };
          }
        ));
    });

    if (useAnchors) {
      this.modelsWithAnchors.forEach(function (model) {
        const modelMat = model.model.getWorldMatrix();
        
        // collect all the anchors    
        result = result.concat(
          model.anchors.filter(a => !a.attachedObject).map(
            function (anchor): ClosestPlacement {
              return { 
                model: model, 
                grid: null, 
                anchor: anchor, 
                distSq: BABYLON.Vector3.DistanceSquared(point, BABYLON.Vector3.TransformCoordinates(anchor.point, modelMat)),
                distY: point.y - BABYLON.Vector3.TransformCoordinates(anchor.point, modelMat).y
              };
            }
          ));
      });
    }
    
    // order everything (grids and anchors) by distance
    result.sort((a, b) => a.distSq - b.distSq);
    
    if (result.length > 0) {
      // it is not possible to place an object across multiple anchors, so if an anchor is the closest, remove everything else from the result
      if (!!result[0].anchor) {
        // if there are free anchors among the results, choose the first of those, otherwise simply the closest
        result = result.filter(cp=>!!cp.anchor); // remove grids
        // no need to filter free anchors anymore, as we filter them out completely in the current version in the first place
//        let freeAnchors = result.filter(cp=>!cp.anchor.attachedObject);
//        if (freeAnchors.length > 0) {
//          result = freeAnchors;
//        }
        result.length = 1; // only return the first result, cannot place across multiple anchors
      } else {
        // an object can be placed across multiple grids, so if a grid is the closest, keep all the grids that are the same height as the first one
        result = result.filter(cp=>!!cp.grid); // remove anchors
        // no need to filter free grids anymore, as we filter them out completely in the current version in the first place
        // if there are grids which are not fully taken, filter out the fully taken ones, 
        // but if there are none, return the closest fully taken ones, so the user can still move objects around on them (just not finish the placement)
//        let freeGrids = result.filter(cp=>!cp.grid.fillTracking.fullyClaimed());
//        if (freeGrids.length > 0) {
//          result = freeGrids;
//        }
        if (result.length > 1) {
          result = result.filter(cp=>(Math.abs(cp.distY-result[0].distY) < 0.0001)); // remove grids at different heights - we can only place across grids with the same height
                                                                                     // account for floating point error 
        }
      }
    }
    
    return result;
  }

  convertAnchors(anchors: CartesianTriple[]): AnchorTracking[] {
    return anchors.map((point) => {
      return {
        point: new BABYLON.Vector3(point.x, point.y, point.z),
        attachedObjects: []
      };
    });
  }

  convertGrids(grids: GridDefinition[]): GridTracking[] {
    return grids.map((grid) => {
      return {
        center: new BABYLON.Vector3(grid.center.x, grid.center.y, grid.center.z),
        fillTracking: new GridFillTracking(grid.hCount, grid.vCount, 0, -1, (grid.maxHeight !== undefined) ? grid.maxHeight : -1),
        attachedObjects: []
      };
    });
  }

  createInterfaceImage(name: string, horizontalAlignment: number, verticalAlignment: number, helperText: string,
                       pointerDownAction: () => void, hoverCursor: string = 'pointer'): BABYLON.GUI.Rectangle {
    const containingRect = new BABYLON.GUI.Rectangle(name + '_container');
    containingRect.thickness = 0;
    containingRect.cornerRadius = 4;
    containingRect.background = 'rgba(255, 255, 255, 0.8)';
    containingRect.width = containingRect.height = '32px';
    containingRect.isPointerBlocker = true;
    containingRect.hoverCursor = hoverCursor;
    containingRect.horizontalAlignment = horizontalAlignment;
    containingRect.verticalAlignment = verticalAlignment;

    const img = new BABYLON.GUI.Image(name, 'assets/img/interface/' + name + '.png');
    img.width = img.height = '32px';
    img.isPointerBlocker = true;
    img.hoverCursor = hoverCursor;
    img.onPointerEnterObservable.add(() => { this.setHelperText(helperText); });
    img.onPointerOutObservable.add(() => { this.setHelperText(''); });
    img.onPointerDownObservable.add(pointerDownAction);

    containingRect.addControl(img);

    return containingRect;
  }

  createMaterial(properties: MaterialProperties) {
    const mat = new BABYLON.PBRMaterial(properties.name + '-source', this.scene);

    mat.reflectionTexture = this.environment;
    mat.reflectionColor = BABYLON.Color3.White().scale(0.1);

    mat.useRoughnessFromMetallicTextureAlpha = false;
    mat.useRoughnessFromMetallicTextureGreen = true;
    mat.useMetallnessFromMetallicTextureBlue = true;
    mat.useAmbientOcclusionFromMetallicTextureRed = true;
    mat.useAmbientInGrayScale = true;

    if (!!properties.color) {
      let isWood = mat.name.toLowerCase().indexOf("wood") >= 0;
      mat.albedoTexture= this.texture("assets/img/textures/colors/" + (isWood ? "wood/" : "") + properties.color.substring(1) + ".png");
    }

    if (!!properties.texture) {
      mat.albedoTexture = this.texture(properties.texture);
    }

    if (!!properties.metallicRoughnessMap) {
      mat.metallic = 1.0;
      mat.roughness = 1.0;

      mat.metallicTexture = this.texture(properties.metallicRoughnessMap);
    } else {
      mat.metallic = properties.metal ? 1.0 : 0.0;
      mat.roughness = properties.roughness;
      if (properties.transparent) {
        mat.alpha = 0.0;
      }
    }

    if (!!properties.normalMap) {
      mat.bumpTexture = this.texture(properties.normalMap);
    }

    mat.emissiveIntensity = 0;
    mat.emissiveColor = BABYLON.Color3.Black();
    
    this.materials.set(properties.name, mat);
  }

  createModel(details: FurnitureObject, userData?: any, isFoundation: boolean = false, select: boolean = true): ModelTracking {
    let model: BABYLON.Mesh = null;

    if (this.assembledRoots.has(details.name)) {
      model = this.assembledRoots.get(details.name).clone(details.name, null, false);
    } else {
      model = this.assembleModel(details.name, details.modelPieces);
    }

    if (!!details.materialReplacements) {
      details.materialReplacements.forEach((mr) => {
        this.replaceMaterials(model, mr.oldMaterialNames, mr.newMaterialName);
      });
    }

    if (!!details.scaling) {
      model.getChildMeshes(false).forEach((cm) => {
        let verts = cm.getVerticesData(BABYLON.VertexBuffer.PositionKind);

        if (!!verts) {
          const scaling = details.scaling;
          const originalSize = scaling.originalSize;
          const constantEdgeSize = scaling.constantEdgeSize;
          const intendedScale = scaling.scale;

          const newMesh = new BABYLON.Mesh(cm.name, this.scene, cm.parent);
          newMesh.material = cm.material;
          newMesh.position = cm.position;
          newMesh.rotationQuaternion = cm.rotationQuaternion;

          const vertData = new BABYLON.VertexData();
          verts = vertData.positions = verts.slice();
          vertData.indices = cm.getIndices();
          vertData.normals = cm.getVerticesData(BABYLON.VertexBuffer.NormalKind);
          vertData.uvs = cm.getVerticesData(BABYLON.VertexBuffer.UVKind);

          const numVerts = verts.length;
          const xOff = (intendedScale.x - originalSize.x) / 200;
          const xScale = intendedScale.x / originalSize.x;
          const xBoundary = (originalSize.x / 2 - constantEdgeSize.x) / 100;
          const yOff = (intendedScale.y - originalSize.y) / 200;
          const yScale = intendedScale.y / originalSize.y;
          const yBoundary = (originalSize.y / 2 - constantEdgeSize.y) / 100;
          const zOff = (intendedScale.z - originalSize.z) / 100;
          const zScale = intendedScale.z / originalSize.z;
          const zBoundary = (originalSize.z - constantEdgeSize.z) / 100;
          let yi = 0;
          let zi = 0;

          for (let xi = 0; xi < numVerts; xi += 3) {
            yi = xi + 1;
            zi = xi + 2;

            if (Math.abs(verts[xi]) > xBoundary) {
              verts[xi] += Math.sign(verts[xi]) * xOff;
            } else {
              verts[xi] *= xScale;
            }
            
            if (Math.abs(verts[yi]) > yBoundary) {
              verts[yi] += Math.sign(verts[yi]) * yOff;
            } else {
              verts[yi] *= yScale;
            }

              if (verts[zi] < -zBoundary) {
                verts[zi] -= zOff;
            } else if (verts[zi] < -0.01) {
                verts[zi] = (verts[zi] - 0.015) * zScale + 0.015;
            }
          }

          vertData.applyToMesh(<BABYLON.Mesh>newMesh);

          newMesh.updatePoseMatrix(cm.getPoseMatrix());

          this.scene.removeMesh(cm, true);
        }
      });
    }

    model.setEnabled(true);

    const setupActionManager = (mesh: BABYLON.AbstractMesh) => {
      mesh.actionManager = new BABYLON.ActionManager(this.scene);
      mesh.actionManager.hoverCursor = 'pointer';
    };

    setupActionManager(model);

    model.getChildMeshes(false).forEach(setupActionManager);
    model.refreshBoundingInfo();

    const mt: ModelTracking =  {
      creationData: details,
      name: details.name,
      color: '#ffffff',
      model: model,
      grids: this.convertGrids(details.gridsProvided || []),
      anchors: this.convertAnchors(details.baseAnchors || []),
      userData: userData,
      gridParents: []
    };

    mt.selectAction = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      this.selectionJustChanged = this.interfaceNet.isVisible && !!this.selectedModel;
      this.select(mt);
    });

    mt.pickupAction = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, () => {
      this.pickUp(mt);
    });

    if (isFoundation) {
      this.foundation = mt;
    }
    
    const matCloneMap = new Map<string, BABYLON.PBRMaterial>();
    
    function replaceMaterial(mesh: BABYLON.AbstractMesh) {
      if (mesh.material) {
        const matName = mesh.material.name;

        if (matCloneMap.has(matName)) {
          mesh.material = matCloneMap.get(matName);
        } else {
          const matClone = <BABYLON.PBRMaterial>mesh.material.clone(matName + '-clone');

          mesh.material = matClone;
          matCloneMap.set(matName, matClone);
        }
      } else {
        mesh.getChildren().forEach(replaceMaterial);
      }
    }

    if (!details.materialReplacements && !!details.partsStyled) {
      this.getStyledMeshes(mt).forEach(replaceMaterial);
    }

    if (select) {
      this.select(mt, true);
    }

    return mt;
  }

  deleteModel(mt: ModelTracking) {
    if (!mt) {
      return;
    }

    if (mt.parent) {
      mt.parent.model.removeChild(mt.model);
    }

    this.scene.removeMesh(mt.model, true);

    mt.anchors.forEach((anchor) => {
      this.deleteModel(anchor.attachedObject);
    });

    mt.grids.forEach((grid) => {
      grid.attachedObjects.slice().forEach((ao) => {
        this.deleteModel(ao);
      });
    });

    this.removeFromLists(mt);
  }

  deleteSelectedModel() {
    if (!this.selectedModel) {
      return;
    }

    const mt = this.selectedModel;

    this.deselect(true);
    this.deleteModel(mt);
  }

  deselect(notify: boolean = false) {
    this.putDown();

    this.makeMeshesAlwaysActive(true);

    const min = BABYLON.Vector3.One().scaleInPlace(Number.POSITIVE_INFINITY);
    const max = BABYLON.Vector3.One().scaleInPlace(Number.NEGATIVE_INFINITY);

    this.activeModels.forEach((mt) => {
      const bounds = this.getObjectWorldBounds(mt);

      min.minimizeInPlace(bounds.minimum);
      max.maximizeInPlace(bounds.maximum);
    });

    const center = max.add(min).scale(0.5);
    const radius = 1.2 * max.subtract(min).length() / 2;

    this.photoCamera.target = center;
    this.photoCamera.radius = radius / Math.tan(this.photoCamera.fov / 2);
    this.photoCamera.alpha = - 5 * Math.PI / 8;
    this.photoCamera.beta = Math.PI / 4;

    BABYLON.Tools.CreateScreenshotUsingRenderTarget(this.engine, this.photoCamera, { width: 1280, height: 1280 },
      (data) => {
        this.currentProductImageBase64 = data;
      }, 'image/jpeg', 1, true);

    this.makeMeshesAlwaysActive(false);

    if (!this.selectedModel) {
      this.updateInterface();
      return;
    }

    this.unregisterActionRecursively(this.selectedModel, this.selectedModel.pickupAction);
    this.registerActionRecursively(this.selectedModel, this.selectedModel.selectAction);

    this.selectedModel = null;

    this.updateInterface();

    if (notify) {
      this.viewerBindingService.notifySelectionChanged(null);
    }
  }

  focusOn(mt: ModelTracking) {
    const trueBounds = this.getObjectWorldBounds(mt);
    const min = trueBounds.minimum;
    const max = trueBounds.maximum;
    const center = min.add(max).scale(0.5);

    this.selectionWorldCenter = center;

    const radius = max.subtract(center).length();
    const camRadius = Math.max(1.1 * radius / Math.tan(this.camera.fov / 2),
      1.1 * radius / Math.tan(this.camera.fov * this.aspectRatio / 2), 0.5);
    const fps = 30;
    const totalFrames = fps * 0.4;
    const easing = new BABYLON.SineEase();
    easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

    BABYLON.Animation.CreateAndStartAnimation('targetChange', this.camera, 'target', fps, totalFrames,
      this.camera.target, center, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, easing);

    BABYLON.Animation.CreateAndStartAnimation('radiusChange', this.camera, 'radius', fps, totalFrames,
      this.camera.radius, camRadius, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, easing);
  }

  getObjectWorldBounds(mt: ModelTracking): BABYLON.BoundingBox {
    mt.model.computeWorldMatrix(true);

    let childMeshes = this.getStyledMeshes(mt, true);

    if (childMeshes.length === 0) {
      childMeshes = mt.model.getChildMeshes(false, function (node) {
        return (<BABYLON.Mesh>node).getTotalVertices() !== 0;
      });
    }

    const min = BABYLON.Vector3.One().scaleInPlace(Number.POSITIVE_INFINITY);
    const max = BABYLON.Vector3.One().scaleInPlace(Number.NEGATIVE_INFINITY);

    childMeshes.forEach(function (cm) {
      const cb = cm.getBoundingInfo();
      const toWorld = cm.getWorldMatrix();

      min.minimizeInPlace(BABYLON.Vector3.TransformCoordinates(cb.boundingBox.minimum, toWorld));
      max.maximizeInPlace(BABYLON.Vector3.TransformCoordinates(cb.boundingBox.maximum, toWorld));
    });

    return new BABYLON.BoundingBox(min, max);
  }

  getStyledMeshes(mt: ModelTracking, computeWorldMatrix: boolean = false): BABYLON.AbstractMesh[] {
    if (!mt.creationData || !mt.creationData.partsStyled) {
      return [];
    }

    if (computeWorldMatrix) {
      mt.model.computeWorldMatrix(true);
    }

    const partsStyled = mt.creationData.partsStyled.map(function (name) {
      return name.split('.').reverse();
    });

    return mt.model.getChildMeshes(false, function (node) {
      const nodeNamePieces = node.name.split('.').reverse();

      if (computeWorldMatrix) {
        node.computeWorldMatrix(true);
      }

      return partsStyled.some(function (partNamePieces) {
        return partNamePieces.every(function (partNamePiece, idx) {
          return partNamePiece === nodeNamePieces[idx];
        });
      });
    });
  }

  haveAnchors(): boolean {
    return this.modelsWithAnchors.length !== 0;
  }

  haveGrids(): boolean {
    return this.modelsWithGrids.length !== 0;
  }

  loadPiece(piece: Model) {
    if (++this.leftToLoad === 1) {
      this.engine.displayLoadingUI();
    }

    BABYLON.SceneLoader.LoadAssetContainer(piece.root, piece.file, this.scene, (assets: BABYLON.AssetContainer) => {
      this.pieceContainers.set(piece.name, assets);

      const rootMesh = assets.meshes.filter(function (mesh: BABYLON.Mesh) {
        return !mesh.parent;
      })[0] as BABYLON.Mesh;

      rootMesh.setEnabled(false);

      this.pieceRoots.set(piece.name, rootMesh);

      assets.addAllToScene();

      if (piece.materialReplacements) {
        piece.materialReplacements.forEach((replacement) => {
          this.replaceMaterials(rootMesh, replacement.oldMaterialNames, replacement.newMaterialName);
        });
      }

      if (--this.leftToLoad === 0) {
        this.engine.hideLoadingUI();
      }
    });
  }

  makeMeshesAlwaysActive(active: boolean) {
    this.scene.meshes.forEach(function (mesh) {
      mesh.alwaysSelectAsActiveMesh = active;

      mesh.getChildMeshes(false).forEach(function (cm) {
        cm.alwaysSelectAsActiveMesh = active;
      });
    });
  }

  ngAfterContentInit() {
    this.displayCanvas = this.renderCanvas.nativeElement;
    this.engine = new BABYLON.Engine(this.displayCanvas, true, { preserveDrawingBuffer: true });
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.85, 0.85, 0.85, 1);
    this.scene.ambientColor = BABYLON.Color3.Black(); // .White().scale(0.4);
    this.scene.collisionsEnabled = true;

    this.interfaceTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('mainUI', true, this.scene);

    this.interfaceNet = new BABYLON.GUI.Rectangle('bg');
    this.interfaceNet.width = this.interfaceNet.height = '100%';
    this.interfaceNet.thickness = 0;
    this.interfaceNet.isVisible = false;
    this.interfaceNet.onPointerClickObservable.add(() => {
      if (this.selectionJustChanged) {
        this.selectionJustChanged = false;

        return;
      }

      if (!this.placing && this.placementSucceeded) {
        this.deselect(true);
      }
    });

    this.interfaceTexture.addControl(this.interfaceNet);

    this.interfaceControls = new BABYLON.GUI.Rectangle('controlsContainer');
    this.interfaceControls.width = this.interfaceControls.height = '160px';
    this.interfaceControls.thickness = 0;
    this.interfaceControls.isVisible = false;

    const interfaceBG = new BABYLON.GUI.Ellipse('controlsBG');
    interfaceBG.width = interfaceBG.height = '128px';
    interfaceBG.color = '#000000';
    interfaceBG.thickness = 3;
    interfaceBG.background = 'rgba(255, 255, 255, 0.5)';
    interfaceBG.isPointerBlocker = true;
    interfaceBG.hoverCursor = 'default';

    this.interfaceControls.addControl(interfaceBG);

    const move = this.createInterfaceImage('move',
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER,
      'REPOSITION', () => { this.pickUpSelectedModel(); }, 'grab');

    this.interfaceControls.addControl(move);

    this.interfaceConfirm = this.createInterfaceImage('check_box',
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP,
      'COMPLETE', () => { this.deselect(true); });

    this.interfaceConfirm.isHitTestVisible = false;
    this.interfaceConfirm.hoverCursor = 'default';

    this.interfaceControls.addControl(this.interfaceConfirm);

    const rotateCW = this.createInterfaceImage('rotate_90_cw',
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER,
      'ROTATE CLOCKWISE', () => { this.rotateSelectedModel(90); });

    this.interfaceControls.addControl(rotateCW);

    const rotateCCW = this.createInterfaceImage('rotate_90_ccw',
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER,
      'ROTATE COUNTER-CLOCKWISE', () => { this.rotateSelectedModel(-90); });

    this.interfaceControls.addControl(rotateCCW);

    const deleteItem = this.createInterfaceImage('delete',
      BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER, BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM,
      'DELETE', () => { this.deleteSelectedModel(); });

    this.interfaceControls.addControl(deleteItem);

    this.interfaceTexture.addControl(this.interfaceControls);

    const numLights = 4;
    const va = Math.PI / 3;
    const ca = Math.cos(va);
    const sa = -Math.sin(va);

    for (let i = 0; i < numLights; ++i) {
      const theta = 2 * Math.PI * i / numLights;
      const dirLight = new BABYLON.DirectionalLight('dirLight' + i,
        new BABYLON.Vector3(Math.cos(theta) * ca, sa, Math.sin(theta) * ca), this.scene);
        
      dirLight.specular = dirLight.diffuse = BABYLON.Color3.White().scale(5 / numLights);
    }

    this.setupCamera();

    this.engine.runRenderLoop(() => { this.render(); });

    this.viewerBindingService.notifyInitialized();
  }

  ngOnDestroy() {
    this.resetSubscription.unsubscribe();
    this.helperTextSubscription.unsubscribe();
  }

  observeDrag(eventData: BABYLON.PointerInfo) {
    this.displayCanvas.style.cursor = 'grabbing';
    const isMove = eventData.type === BABYLON.PointerEventTypes.POINTERMOVE;
    const isUp = eventData.type === BABYLON.PointerEventTypes.POINTERUP;

    if (isMove || isUp) {
      if (eventData.pickInfo.hit) {
        const useAnchors = this.selectedModel.creationData.canUseBaseAnchor;
        const picked = eventData.pickInfo.pickedMesh;
        const targetModels = (useAnchors ? this.modelsWithAnchors.concat(this.modelsWithGrids) : this.modelsWithGrids)
          .filter((mt) => {
            return picked.isDescendantOf(mt.model);
          });

        this.snapModel(this.selectedModel, eventData.pickInfo.pickedPoint, !isUp, (targetModels.length > 0) ? targetModels[0] : null);
      }

      if (isUp) {
        this.putDown(false);
      }
    }
  }

  pickUp(mt: ModelTracking) {
    this.placing = true;
    this.displayCanvas.style.cursor = 'grabbing';

    if (this.selectedModel !== mt) {
      this.deselect();
      this.select(mt);
    }

    this.unregisterActionRecursively(mt, mt.pickupAction);

    this.setPickable(mt, false);
    this.removeFromLists(mt);
    this.updateInterface();

    if (!!mt.parent) {
      mt.parent = null;
    }

    this.activeModels.forEach((amt) => {
      this.unregisterActionRecursively(amt, amt.selectAction);
    });

    this.dragObserver = this.scene.onPointerObservable.add((eventData) => {
      this.observeDrag(eventData);
    });

    this.camera.inputs.attached.pointers.detachControl(this.displayCanvas);
  }

  pickUpSelectedModel() {
    if (!!this.selectedModel) {
      this.pickUp(this.selectedModel);
    }
  }

  placedModels(): SimpleModelTracking[] {
    return this.activeModels;
  }

  putDown(deleteOnFail: boolean = true) {
    if (!this.placing) {
      if (!this.placementSucceeded && deleteOnFail) {
        this.deleteModel(this.selectedModel);
        this.selectedModel = null;
      }

      return;
    }

    this.camera.inputs.attachInput(this.camera.inputs.attached.pointers);

    this.displayCanvas.style.cursor = undefined;

    this.activeModels.forEach((amt) => {
      if (amt !== this.selectedModel) {
        this.registerActionRecursively(amt, amt.selectAction);
      }
    });

    if (!this.selectedModel) {
      this.placing = false;
      this.updateInterface();

      return;
    }

    const trueBounds = this.getObjectWorldBounds(this.selectedModel);
    this.selectionWorldCenter = trueBounds.minimum.add(trueBounds.maximum).scale(0.5);

    this.scene.onPointerObservable.remove(this.dragObserver);
    this.dragObserver = null;

    this.setPickable(this.selectedModel, true);
    this.registerActionRecursively(this.selectedModel, this.selectedModel.pickupAction, 'grab');

    this.placementSucceeded = this.tryPlace(this.selectedModel) === TryPlaceResult.Success;

    if (this.placementSucceeded) {
      this.setAllEmissive(this.selectedModel.model, 0);
      this.addToLists(this.selectedModel);
    } else if (deleteOnFail) {
      this.deleteModel(this.selectedModel);
      this.selectedModel = null;
    } else {
      this.setAllEmissive(this.selectedModel.model, 1);
    }

    this.placing = false;
    this.updateInterface();
  }

  registerActionRecursively(mt: ModelTracking, action: BABYLON.Action, cursor: string = 'pointer') {
    [<BABYLON.AbstractMesh>mt.model].concat(mt.model.getChildMeshes(false))
      .forEach(function (mesh) {
        mesh.actionManager.hoverCursor = cursor;
        mesh.actionManager.registerAction(action);
      });
  }

  removeFromLists(mt: ModelTracking, removeFromParent: boolean = true) {
    if (removeFromParent) {
      if (mt.parent) {
        mt.parent.anchors.forEach(function (anchor) {
          if (anchor.attachedObject === mt) {
            anchor.attachedObject = null;
          }
        });
      }
      
      // remove from all grids it was attached to
      mt.gridParents.forEach(function (parent) {
        parent.grids.forEach(function (grid) {
          const aoi = grid.attachedObjects.indexOf(mt);

          if (aoi !== -1) {
            grid.attachedObjects.splice(aoi, 1);
            grid.fillTracking.freeCells(mt.model.uniqueId);
          }
        });
      });  
      mt.gridParents.length = 0;
    }

    const ai = this.activeModels.indexOf(mt);

    if (ai !== -1) {
      this.activeModels.splice(ai, 1);

      if (mt.anchors.length !== 0) {
        this.modelsWithAnchors.splice(this.modelsWithAnchors.indexOf(mt), 1);
      }

      if (mt.grids.length !== 0) {
        this.modelsWithGrids.splice(this.modelsWithGrids.indexOf(mt), 1);
      }
    }
  }

  render() {
    this.resizeAsNeeded();

    if ((this.camera.radius !== this.oldCamRadius) ||
      (BABYLON.Vector3.DistanceSquared(this.oldCamTarget, this.camera.target) > Number.EPSILON)) {
      this.camera.upperBetaLimit = Math.PI - Math.acos((this.camera.target.y - this.camera.minZ) / this.camera.radius);

      this.oldCamTarget = this.camera.target.clone();
      this.oldCamRadius = this.camera.radius;
    }

    this.scene.render();
  }

  replaceMaterials(mesh: BABYLON.Mesh, oldMaterialNames: string[], newMaterialName: string) {
    if (!this.materials.has(newMaterialName)) {
      return;
    }

    const sourceMat = this.materials.get(newMaterialName);

    const replaceIfMatching = function (subMesh: BABYLON.Mesh) {
      if (subMesh.material && (oldMaterialNames.indexOf(subMesh.material.name.replace('-clone', '')) !== -1)) {
        const newMat = sourceMat.clone(newMaterialName);

        newMat.sideOrientation = subMesh.material.sideOrientation;

        subMesh.material = newMat;
      }
    };

    replaceIfMatching(mesh);

    mesh.getChildMeshes(false).forEach(replaceIfMatching);
  }

  resizeAsNeeded() {
    const measuredWidth = this.displayCanvas.clientWidth;
    const measuredHeight = this.displayCanvas.clientHeight;

    if ((measuredWidth === this.knownWidth) && (measuredHeight === this.knownHeight)) {
      return;
    }

    if (this.knownWidth !== 0) {
      this.knownWidth = 0;
      this.knownHeight = 0;
      this.displayCanvas.removeAttribute('width');
      this.displayCanvas.removeAttribute('height');
    }

    this.knownWidth = measuredWidth;
    this.knownHeight = measuredHeight;
    this.aspectRatio = measuredWidth / measuredHeight;

    this.engine.resize();
  }

  rotateChildrenAroundPoint(tracking: ModelTracking, worldPoint: BABYLON.Vector3, radians: number) {
    const up = BABYLON.Vector3.Up();

    tracking.anchors.forEach((anchorTracking) => {
      if (!!anchorTracking.attachedObject) {
        anchorTracking.attachedObject.model.rotateAround(worldPoint, up, radians);

        this.rotateChildrenAroundPoint(anchorTracking.attachedObject, worldPoint, radians);
      }
    });

    tracking.grids.forEach((gridTracking) => {
      gridTracking.attachedObjects.forEach((modelTracking) => {
        modelTracking.model.rotateAround(worldPoint, up, radians);

        this.rotateChildrenAroundPoint(modelTracking, worldPoint, radians);
      });
    });
  }

  rotateSelectedModel(amount: number) {
    const radians = BABYLON.Angle.FromDegrees(amount).radians();

    this.selectedModel.model.rotate(BABYLON.Vector3.Up(), radians);

    const worldPos = this.selectedModel.model.absolutePosition;
    
    // remove models on top which are placed across this model and others (across multiple grids)
    this.selectedModel.grids.forEach((gridTracking) => {
      gridTracking.attachedObjects.slice().forEach((modelTracking) => {
        if (modelTracking.gridParents.length > 1) {
          this.deleteModel(modelTracking);
        }
      });
    });

    this.rotateChildrenAroundPoint(this.selectedModel, worldPos, radians);

    this.selectedModel.model.computeWorldMatrix(true);

    this.pickUp(this.selectedModel);
    this.snapModel(this.selectedModel, worldPos);
    this.putDown(false);
  }

  select(mt: ModelTracking, notify: boolean = true) {
    if (!!this.selectedModel) {
      this.deselect();
    }

    this.selectedModel = mt;
    this.placementSucceeded = true;

    this.unregisterActionRecursively(mt, mt.selectAction);
    this.focusOn(mt);
    this.updateInterface();

    if (mt !== this.foundation) {
      this.registerActionRecursively(mt, mt.pickupAction, 'grab');
    }

    if (notify) {
      this.viewerBindingService.notifySelectionChanged(mt.userData);
    }
  }

  selectFoundation() {
    if (!!this.foundation) {
      this.select(this.foundation);
    }
  }

  setAllEmissive(model: BABYLON.Mesh, amount: number) {
    model.getChildMeshes(false).forEach(function (cm) {
      const mat = <BABYLON.PBRMaterial>cm.material;

      if (!!mat) {
        mat.emissiveIntensity = amount;
      }
    });
  }

  setEnvironment(textureBaseName: string) {
    let envTex = null;

    if (textureBaseName.indexOf('.dds') !== -1) {
      envTex = BABYLON.CubeTexture.CreateFromPrefilteredData(textureBaseName, this.scene);
    } else if (textureBaseName.indexOf('.hdr') !== -1) {
      envTex = new BABYLON.HDRCubeTexture(textureBaseName, this.scene, 512);
    } else {
      envTex = new BABYLON.CubeTexture(textureBaseName, this.scene);
    }

    this.environment = envTex;
  }

  setFoundation(details: FurnitureObject, userData?: any) {
    if (this.foundation) {
      if (details && (this.foundation.name === details.name)) {
        return;
      }

      this.deselect(true);
      this.deleteModel(this.foundation);
      this.foundation = null;
    }

    if (!details) {
      return;
    }

    this.createModel(details, userData, true);
    this.addToLists(this.foundation);
  }

  setPickable(mt: ModelTracking, value: boolean) {
    mt.model.isPickable = value;

    mt.model.getChildMeshes(false).forEach(function (m) {
      m.isPickable = value;
    });
  }

  setScene(details: Model) {
    BABYLON.SceneLoader.Append(details.root, details.file, this.scene, (scene) => {
      if (details.materialReplacements) {
        details.materialReplacements.forEach((replacement) => {
          scene.meshes.forEach((am) => {
            this.replaceMaterials(<BABYLON.Mesh>am, replacement.oldMaterialNames, replacement.newMaterialName);
          });
        });
      }
    });
  }

  setupCamera() {
    this.camera = new BABYLON.ArcRotateCamera('mainCam', -5 * Math.PI / 8, Math.PI / 4, 2,
      new BABYLON.Vector3(0, 0, 0), this.scene, true);
    this.camera.wheelPrecision = 500;
    this.camera.panningSensibility = 2000;
    this.camera.pinchPrecision = 512;
    this.camera.minZ = 0.01;
    this.camera.maxZ = 25;
    this.camera.lowerRadiusLimit = 0.01;
    this.camera.upperRadiusLimit = 5;
    this.camera.collisionRadius = BABYLON.Vector3.One().scaleInPlace(0.02);
    this.camera.checkCollisions = true;
    this.camera.onViewMatrixChangedObservable.add(() => {
      if (this.interfaceControls.isVisible) {
        this.interfaceControls.moveToVector3(this.selectionWorldCenter, this.scene);
      }
    });
    this.camera.attachControl(this.displayCanvas);

    this.photoCamera = new BABYLON.ArcRotateCamera('photoCam', - 5 * Math.PI / 8, Math.PI / 4, 2,
      new BABYLON.Vector3(0, 0, 0), this.scene, false);
    this.photoCamera.minZ = 0.01;
    this.photoCamera.maxZ = 25;
  }

  // Returns the closest placement options (can be an anchor or multiple grids at the same height)
  snapModel(model: ModelTracking, startPoint: BABYLON.Vector3, useOffset: boolean = false,
                    targetModel?: ModelTracking): ClosestPlacement[] {
    const modelStartPos = model.model.position.clone();
    const useAnchors = model.creationData.canUseBaseAnchor;
    const closests = !!targetModel ?
      this.closestPlacementsOnModel(startPoint, targetModel, useAnchors) : this.closestPlacementsToPoint(startPoint, useAnchors);
    if (closests.length > 0) {  
      const closest = closests[0];  
      const localToWorld = closest.model.model.getWorldMatrix();
      const worldToLocal = localToWorld.clone().invert();
      const round = function (v: BABYLON.Vector3): BABYLON.Vector3 {
        return new BABYLON.Vector3(0.12 * Math.round(v.x / 0.12), v.y, 0.12 * Math.round(v.z / 0.12));
      };

      if (!!closest.grid) {
        const selectedToWorld = model.model.getWorldMatrix();
        const selectedToLocal = worldToLocal.multiply(selectedToWorld);
        const modelSpaceOriginPoint = BABYLON.Vector3.TransformCoordinates(startPoint, worldToLocal);
        const modelX = new BABYLON.Vector4(1, 0, 0, 0);
        const modelY = new BABYLON.Vector4(0, 0, 1, 0);
        const modelLocalH = BABYLON.Vector4.TransformNormal(modelX, selectedToLocal);
        const modelLocalV = BABYLON.Vector4.TransformNormal(modelY, selectedToLocal);
        const gp0 = model.creationData.gridPatternRequired[0];
        const gp0c = new BABYLON.Vector3(gp0.center.x, gp0.center.y, gp0.center.z);
        const modelSpacePoint = modelSpaceOriginPoint.add(modelLocalH.scale(gp0c.x - gp0.hCount * 0.06).toVector3())
          .add(modelLocalV.scale(gp0c.z - gp0.vCount * 0.06).toVector3());
        const fillTracking = closest.grid.fillTracking;
        const gridOrigin = closest.grid.center
          .subtract(new BABYLON.Vector3(fillTracking.width * 0.06, 0, fillTracking.height * 0.06));
        const correctedPoint = round(modelSpacePoint.subtract(gridOrigin)).add(gridOrigin);
        correctedPoint.y = gridOrigin.y;
        const localCorrection = correctedPoint.subtract(modelSpacePoint);

        model.model.position = BABYLON.Vector3.TransformCoordinates(modelSpaceOriginPoint.add(localCorrection), localToWorld);
      } else {
        model.model.position = BABYLON.Vector3.TransformCoordinates(closest.anchor.point, localToWorld);
      }
      
      if (useOffset) {
        model.model.position.y += DRAG_HEIGHT_OFFSET;
      }
    }

    const modelShift = model.model.position.subtract(modelStartPos);

    this.adjustChildren(model, modelShift);

    return closests;
  }

  startPlacing(details: FurnitureObject, userData?: any): boolean {
    if (!this.foundation) {
      return false;
    }

    let startPos = this.camera.target;
    
    let previousSelectedModel = this.selectedModel;

    if (!!this.selectedModel) {
      startPos = this.selectedModel.model.position;
      this.deleteModel(this.selectedModel);
      this.selectedModel = null;
    }

    const mt = this.createModel(details, userData, false, false);
    mt.model.position = startPos;

    const placementResult = this.tryPlace(mt);
    
    let created = (placementResult !== TryPlaceResult.FailureNoFreePlace);
    
    if (created) {
      
      this.select(mt);
      
      this.placementSucceeded = (placementResult === TryPlaceResult.Success);

      if (!this.placementSucceeded) {
        this.setAllEmissive(this.selectedModel.model, 1);
      } else {
        this.addToLists(mt);
      }
      
    } else {
      this.deleteModel(mt);
      this.selectedModel = null;
      if (previousSelectedModel) {
        this.select(previousSelectedModel);
      }
      this.setHelperText('ALL AREAS ARE FULL', '#ff0000');
    }
    this.updateInterface();
    return created;
  }

  texture(url: string): BABYLON.Texture {
    if (this.textures.has(url)) {
      return this.textures.get(url);
    }

    const tex = new BABYLON.Texture(url, this.scene, false, false);

    this.textures.set(url, tex);

    return tex;
  }
  
  getGridRelativeInfo(mt: ModelTracking, closest: ClosestPlacement): GridRelativeInfo {
    const localToWorld = closest.model.model.getWorldMatrix();
    const worldToLocal = localToWorld.clone().invert();
    const selectedToWorld = mt.model.getWorldMatrix();
    const selectedToLocal = worldToLocal.multiply(selectedToWorld);
    const modelX = new BABYLON.Vector4(1, 0, 0, 0);
    const modelY = new BABYLON.Vector4(0, 0, 1, 0);
    const closestGridTracking = closest.grid.fillTracking;
    return {
      modelLocalH: BABYLON.Vector4.TransformNormal(modelX, selectedToLocal).toVector3(),
      modelLocalV: BABYLON.Vector4.TransformNormal(modelY, selectedToLocal).toVector3(),
      localOrigin: BABYLON.Vector3.TransformCoordinates(mt.model.position, worldToLocal),
      closestGridOrigin: closest.grid.center
        .subtract(new BABYLON.Vector3(closestGridTracking.width * 0.06, 0, closestGridTracking.height * 0.06))
    };
  }
  
  getGridRelativePosition(gp: GridDefinition, localOrigin: BABYLON.Vector3, modelLocalH: BABYLON.Vector3, modelLocalV: BABYLON.Vector3, closestGridOrigin: BABYLON.Vector3): GridPosition {
    const gridOrigin = localOrigin.add(modelLocalH.scale(gp.center.x)).add(modelLocalV.scale(gp.center.z));
    const halfWidth = modelLocalH.scale(gp.hCount * 0.06);
    const halfHeight = modelLocalV.scale(gp.vCount * 0.06);
    const bottomLeft = gridOrigin.subtract(halfWidth).subtract(halfHeight).subtract(closestGridOrigin).scale(1 / 0.12);
    return {
      x: Math.round(bottomLeft.x),
      y: Math.round(bottomLeft.z)
    };
  }

  tryPlace(mt: ModelTracking): TryPlaceResult {
    mt.model.computeWorldMatrix(true);

    const closests = this.snapModel(mt, mt.model.absolutePosition);
    let placedCorrectly = false;

    mt.model.computeWorldMatrix(true);
    
    let gridFillPatterns: GridFillPattern[]; // these mark the shape of the botton of the object being placed, to check if all of it is supported properly
    
    const modelHeight = (!!mt.creationData.scaling) ? mt.creationData.scaling.scale.z : -1;

    if (closests.length > 0) {
      // First, check if the object to place can be fully supported:
      // - it has a free anchor to be placed on
      // OR
      // - all of the cells of all its placement grids are covered by the available grids
      // closests has all our closest placement options (the closest anchor or the closest, same-height grids)
      closests.forEach(closest => {
        if (placedCorrectly) { // already found full support
          return;
        }
        if (!!closest.anchor) {
          // the closest placement option is an anchor
          if (!!closest.anchor.attachedObject) { // it is already taken, no luck
            return;
          }
          // the anchor is free, we can place the object!
          placedCorrectly = true;
          return;
        } else {
          // We have grid options instead of anchor, need to check cell-by-cell if all parts of the object to place is supported by these grids
          const modelID = mt.model.uniqueId;
          // first we need to generate the placement GridFillTrackings which will track which parts of the object are supported
          // (the object can have multiple grid patterns resulting in multiple GridFillTrackings, but each fill tracking has to
          // be checked cell-by-cell for support
          gridFillPatterns = gridFillPatterns || mt.creationData.gridPatternRequired.map(gp => {
            return {
              ft: new GridFillTracking(gp.hCount, gp.vCount, modelID, (gp.requiredHeight !== undefined) ? gp.requiredHeight : modelHeight, -1),
              gp: gp
            };
          });

          let {localOrigin, modelLocalH, modelLocalV, closestGridOrigin} = this.getGridRelativeInfo(mt, closest);
          
          gridFillPatterns.forEach(gfp=> {
            let {x, y} = this.getGridRelativePosition(gfp.gp, localOrigin, modelLocalH, modelLocalV, closestGridOrigin);
            // mark the cells that can be supported by this grid
            closest.grid.fillTracking.markForPlacement(gfp.ft, x, y, modelLocalH, modelLocalV);
          });

        }
      });  
      
      // Placement is possible if we already marked it as true (placed on an anchor) or all the gridFillPatterns of the object were fully marked as supported by the grids
      placedCorrectly = placedCorrectly || (gridFillPatterns && gridFillPatterns.every(gfp => gfp.ft.fullyClaimed()));
      
      // If placement is possible, mark that the object was placed on the anchor or on the grids
      if (placedCorrectly) {
        let height = -1; // the lowest maximum height provided by the grids we place on (negative: no limit)
        
        closests.forEach(closest=>{
          if (!!closest.anchor) {
            closest.anchor.attachedObject = mt;
            mt.parent = closest.model;
          } else {
            if (gridFillPatterns) {
              let {localOrigin, modelLocalH, modelLocalV, closestGridOrigin} = this.getGridRelativeInfo(mt, closest);
              
              const closestGridTracking = closest.grid.fillTracking;
              
              if (closestGridTracking.maxHeight >= 0) { // negative maxHeight means we have no limit
                if ((height === -1) || (closestGridTracking.maxHeight < height)) {
                  height = closestGridTracking.maxHeight;
                }
              }

              gridFillPatterns.forEach(gfp=> {
                        
                let {x, y} = this.getGridRelativePosition(gfp.gp, localOrigin, modelLocalH, modelLocalV, closestGridOrigin);  
              
                closestGridTracking.freeCells(gfp.ft.filledBy); // remove markings about the same object from any previous positions it was placed at
                if (closestGridTracking.claimForFT(gfp.ft, x, y, modelLocalH, modelLocalV)) { // add the markings at the new position
                  // if any of the cells of this grid were claimed (maybe not, we might have two possible grids and the object is fully placed on a single one of them)
                  // then we mark the parent-child relationship
                  closest.grid.attachedObjects.push(mt); 
                  mt.gridParents.push(closest.model);
                }
              });
            }
          }
        });
        
        // if placed on grids with limited height, we need to mark that the grids provided by this model will be even more limited in provided height
        // e.g. placing a 24cm high object that has a grid on top of it (like a base) on a 36 cm high shelf would mean that only 12 cm if left,
        // so we need to mark the grid on the top of our placed object to only accept object with 12 cm max height
        if (mt.grids && gridFillPatterns && (gridFillPatterns.length > 0) && (height >= 0)) {
          let modelHeight = Math.max(0, gridFillPatterns[0].ft.requiredHeight);
          if ((modelHeight <= 0) && !!mt.creationData.scaling) {
            modelHeight = mt.creationData.scaling.scale.z;
          }
          let maxHeight = Math.max(0, height - modelHeight); // lowest maximum height of the grids we placed on top of minus the height of our placed object
          mt.grids.forEach((grid)=>{
            grid.fillTracking.maxHeight = maxHeight;
          });
        }
      }
      return placedCorrectly ? TryPlaceResult.Success : TryPlaceResult.FailureInvalid;
    } else {
      return TryPlaceResult.FailureNoFreePlace;
    }
  }

  unregisterActionRecursively(mt: ModelTracking, action: BABYLON.Action) {
    mt.model.actionManager.unregisterAction(action);

    mt.model.getChildMeshes(false).forEach(function (mesh) {
      mesh.actionManager.unregisterAction(action);
    });
  }

  updateInterface() {
    this.interfaceNet.isVisible = this.interfaceControls.isVisible =
      !!this.selectedModel && (this.selectedModel !== this.foundation) && !this.placing;
    const confirmImage = this.interfaceConfirm.children[0];

    this.interfaceConfirm.isHitTestVisible = !this.placementSucceeded;
    this.interfaceConfirm.hoverCursor = this.placementSucceeded ? null : 'default';
    confirmImage.isHitTestVisible = this.placementSucceeded;
    confirmImage.alpha = this.placementSucceeded ? 1.0 : 0.5;

    this.interfaceControls.moveToVector3(this.selectionWorldCenter, this.scene);
  }
}
