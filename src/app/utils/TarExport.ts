import 'ccapture.js/src/tar';
import * as CCapture from 'ccapture.js/src/CCapture.js';
import {FileUploadProgressCallback, FileUploadResponse, IExportPreview, VideoConverterOptions} from './ExportCommon';


export class TarExport {


    options: VideoConverterOptions;
    debug: true;
    private converter: CCapture;
    private sigCancel: boolean;


    constructor(private width: number = 512, private height: number = 512, options?: VideoConverterOptions) {

        const defaults: VideoConverterOptions = {quality: 8, framesPerSecond: 30, totalFrames: 60};
        this.options = Object.assign(defaults, options);


        this.createConverter();

    }

    createConverter() {

        // Create a capturer that exports PNG images in a TAR file
        this.converter = new CCapture({
            format: 'png',
            // framerate: 60,
            verbose: false,
            // timeLimit: 2
        });
    }

    addFrame(canvasElement) {
        this.converter.capture(canvasElement);
    }


    cancel() {
        this.sigCancel = true;

    }


    async grabFrames(scene: BABYLON.Scene, canvasElement: HTMLCanvasElement, preview: IExportPreview, progessCB: FileUploadProgressCallback | undefined) {

        this.converter.start();
        // --------------------------


        const amount = this.options.totalFrames;
        return new Promise((resolve, reject) => {


            let imgNm = 0;

            let setSize, stopCapture, captureNextFrame;

            setSize = () => {
                scene.getEngine().setSize(this.width, this.height);
            };

            stopCapture = () => {

                scene.unregisterBeforeRender(setSize);
                scene.unregisterAfterRender(captureNextFrame);
                this.converter.stop();
            };

            captureNextFrame = () => {

                // make sure to reject if cancel flag is set
                if (this.sigCancel) {
                    stopCapture();
                    reject(new Error('canceled manually'));
                }

                if (imgNm <= amount) {


                    progessCB(imgNm / amount, 'capturing');

                    this.addFrame(canvasElement);

                    // Add a constant rotation per frame.

                    preview.setPreviewTargetRotation(imgNm * 2 * Math.PI / amount);

                    imgNm++;
                } else {
                    stopCapture();
                    resolve();
                }
            };


            scene.registerBeforeRender(setSize);
            scene.registerAfterRender(captureNextFrame);


        });


    }


    async startRecording(canvasElement: HTMLCanvasElement, scene, preview: IExportPreview, progessCB?: FileUploadProgressCallback): Promise<FileUploadResponse> {


        await this.grabFrames(scene, canvasElement, preview, progessCB).catch(console.error);


        this.converter.on('progress', progessCB);

        return new Promise<FileUploadResponse>((resolve, reject) => {

            this.converter.on('progress', () => {

                if (this.sigCancel) {

                    reject(new Error('canceled manually'));
                }

            });

            this.converter.save((blob) => {
                const url = URL.createObjectURL(blob);
                console.log('tar blob', url);


                resolve({url, blob});
            });


        });
    }

}
