import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';
import {facebookShare} from '../utils/Facebook';

import {ViewerService} from '../viewer.service';
import {ExportPreviewFullFeatured} from '../utils/ExportPreviewFullFeatured';
import {FileUpload, UploadResponseObject} from '../utils/FileUpload';
import config from './config';

import {TarExport} from '../utils/TarExport';

import {socket, socketStartListening} from '../utils/Socket';
// import {RawExportPreview} from '../utils/RawExportPreview';
import {FileUploadProgressCallback, FileUploadResponse, IExportPreview, VideoConverterOptions} from '../utils/ExportCommon';
import {BaseExportPreview} from '../utils/BaseExportPreview';
import {ExportPreviewFullFeaturedGodRays} from '../utils/ExportPreviewFullFeaturedGodRays';

socketStartListening();


@Component({
    selector: 'app-share-modal',
    templateUrl: './share-modal.component.html',
    styleUrls: ['./share-modal.component.css']
})
export class ShareModalComponent implements AfterViewInit, OnDestroy {

    @ViewChild('canvasContainer')
    canvasContainer: ElementRef<HTMLDivElement>;
    public scene: BABYLON.Scene;
    debug = config.debug;
    progress = false;

    // ---------------------
    // general progress info
    progressType = '';
    progressPercentage = 0;
    created = false;
    uploaded = false;
    // --------------------
    error = '';
    uploadResponse: UploadResponseObject = null;
    availablePreviews = {
        default: {
            name: 'default', ctor: ExportPreviewFullFeatured
        },
        special: {
            name: 'special', ctor: ExportPreviewFullFeaturedGodRays
        },
        basic: {
            name: 'basic', ctor: BaseExportPreview
        }
    };
    previewInstances = {};
    public enableSharingButtons = false;
    // --------------------
    private displayCanvas: HTMLCanvasElement;
    private preview: IExportPreview;
    private fileUpload: FileUpload;
    private exporter: any;
    private previousCanvasContainer: HTMLElement | null;
    private interval1;

    constructor(private modalRef: BsModalRef, private viewerService: ViewerService, private zone: NgZone) {

        window['that'] = this;


        socket.on('convert-progress', (data) => {
            this.zone.run(() => {


                this.setProgress(data.percentage, 100, 'Converting ' + data.format);

                if (data.percentage >= 99)
                    this.created = true;

                console.log(this.progress, this.progressType, this.progressPercentage);


                // TODO @7frank work flow...
                if (!this.progress && this.progressType == 'Converting jpg') {

                    // disable the overlay as soon as sockerio returns that the jpg was converted
                    this.enableSharingButtons = true;

                }


            });

        });


    }

    // TODO @7frank add "format" parameter
    getShareURL(data: UploadResponseObject) {
        return config.share.baseURL + config.share.shareRoute + data.id + '/' + data.format;

    }

    getVideoURL(data: UploadResponseObject) {
        return config.share.baseURL + config.share.imagesRoute + data.id + '.' + data.format;

    }


    getTwitterShareURL(data: UploadResponseObject) {
        // TODO
        return config.share.baseURL + '/twitter/video/' + data.id + '.' + data.format;

    }


    shareWithFacebook() {
        if (!this.uploadResponse) {
            return;
        }
        const url = this.getShareURL(this.uploadResponse);
        facebookShare(url);
        // TODO what to do after facebook share
        // .then(() => this.close());

    }


    // TODO @7frank fix download with tar files
    download() {

        const link = <HTMLAnchorElement>document.createElement('a');


        link.href = this.getVideoURL(this.uploadResponse); // this.getGifEl().src;
        link.download = 'Download.' + this.uploadResponse.format;
        document.body.appendChild(link);
        link.click();
    }

    setProgress(current, maximum, action: string) {

        this.progressPercentage = Math.round(100 * current / maximum);
        this.progress = this.progressPercentage != 100;
        this.progressType = action;
    }

    close() {

        this.undoPreviewMode();
        this.modalRef.hide();

    }

    undoPreviewMode() {
        if (this.exporter) {

            this.exporter.cancel();
        }
        this.viewerService.viewer.resizeOnRender = true;
        this.viewerService.viewer.resizeAsNeeded(true);
        this.preview.disablePreview();


        this.previousCanvasContainer.appendChild(this.displayCanvas);


    }


    getPreviewMesh() {
        return this.viewerService.viewer.getActiveWeapon();
    }

    async createTarFromCanvas(progressCallback: FileUploadProgressCallback, overrideConfig?: VideoConverterOptions): Promise<FileUploadResponse> {


        this.exporter = new TarExport(config.video.width, config.video.height, Object.assign(config.video.options, overrideConfig));


        const start = window.performance.now();
        const result = await this.exporter.startRecording(this.displayCanvas, this.scene, this.preview, progressCallback);


        const stop = window.performance.now();

        console.log('Creating Tar took:', (stop - start) / 1000, ' seconds');
        return result;
    }


    async initVideoExport(overrideConfig?: VideoConverterOptions, uploadImmediate: boolean = true) {


        this.uploaded = false;

        this.error = '';
        this.setProgress(0, 1, '');

        if (!this.fileUpload) {
            this.fileUpload = (new FileUpload);
        }

        this.fileUpload.cancelLastUpload();


        let result;
        try {


            result = await this.createTarFromCanvas((val) => {

                // FIXME progress is only triggered on convert not while capturing

                this.setProgress(val, 1, 'Generating Tar');
            }, overrideConfig);


        } catch (e) {
            console.warn(e);
            this.error = e.message;
            return;
        }


        if (!uploadImmediate) {
            return;
        }

        const uploadRoute = config.share.baseURL + config.share.fileUploadRoute;

        this.fileUpload.setRemote(uploadRoute);

        const gifPromise = this.fileUpload.uploadBlob(result.blob, undefined, (e) => {

            console.log(e.loaded, e.total);

            this.setProgress(e.loaded, e.total, 'Uploading ...');

        });


        gifPromise.catch((e) => {
            this.error = 'Failed to upload file. Server not resonding.';
        });
        const response = await gifPromise;


        if (!response.error) {

            this.setShareElements(response);

            this.updateDebugResponse(response);

            this.uploaded = true;
        } else {
            this.error = response.error;
        }

    }

    updateDebugResponse(response: UploadResponseObject) {

        if (!this.debug) {
            return;
        }

        // if video created load video

        // if image created load video

        const url = this.getShareURL(response);

        console.log('share URL: ', url);

    }


    setShareElements(data: UploadResponseObject) {
        this.uploadResponse = data;
    }

    // FIXME @7frank remove all previews from the global scene otherwise re-opening dialog
    // will create multiple instances of the individual objects
    ngOnDestroy(): void {
        this.close();


    }

    ngAfterViewInit(): void {


        this.displayCanvas = this.viewerService.viewer.renderCanvas.nativeElement;
        this.scene = this.viewerService.viewer.scene;

        this.previousCanvasContainer = this.displayCanvas.parentElement;
        this.canvasContainer.nativeElement.appendChild(this.displayCanvas);

        this.viewerService.viewer.resizeOnRender = false;

        this.scene.getEngine().setSize(512, 512);


        this.preparePreview(this.availablePreviews.default);


    }

    preparePreview(obj: { name: string, ctor: any }) {
        if (this.preview) {
            this.preview.disablePreview();
        }

        if (!this.previewInstances[obj.name]) {
            this.previewInstances[obj.name] = new obj.ctor(this.scene, this.displayCanvas);

        }

        this.preview = this.previewInstances[obj.name];

        this.preview.enablePreview(this.getPreviewMesh(), this.viewerService.viewer.previewOptions);

    }

    //TODO @7frank use as default
    initPreviewRotationAnimation() {

        // sample code for testing rotation and offsets

        // that.preview.rotationOffset.x = 0.5;
        // that.preview.setPreviewTargetRotation(0);
        clearInterval(this.interval1);
        let angle = 0;
        this.interval1 = setInterval(() => {

            this.preview.setPreviewTargetRotation(angle);
            angle += 0.05;
        }, 1000 / 60);

    }


    initTwitterShare() {

        const url = this.getTwitterShareURL(this.uploadResponse);
        console.log('initTwitterShare', url);
        window.open(url);
    }
}
