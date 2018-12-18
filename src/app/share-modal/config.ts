import {VideoConverterOptions} from '../utils/ExportCommon';

export interface Config {
    share:
        {
            baseURL: string;
            shareRoute: string;
            fileUploadRoute: string;
            imagesRoute: string;
        };
    video: {
        height?: number;
        width?: number;
        options: VideoConverterOptions
    };
    debug?: boolean;
}

const isDebugMode = (<any>window).location.hash === '#debug';

export const defaults: Config = {
    share: {
        baseURL: window.location.origin,
        shareRoute: '/api/share/',

        fileUploadRoute: '/api/uploadTar',
        imagesRoute: '/images/'
    },
    video: {
        height: 512,
        width: 512,
        options: {quality: 15, totalFrames: 120, framesPerSecond: 30}
    }
};


export const debug: Config = {
    share: {
        baseURL: window.location.origin,
        shareRoute: '/api/share/',
        fileUploadRoute: '/api/uploadTar',
        imagesRoute: '/images/'
    },
    video: {
        height: 512,
        width: 512,
        options: {quality: 15, totalFrames: 2, framesPerSecond: 30}
    }
};

// TODO @7frank do we need mobile settings?
export const mobile: Config = {
    share: {
        baseURL: window.location.origin,
        shareRoute: '/api/share/',
        fileUploadRoute: '/api/uploadTar',
        imagesRoute: '/images/'
    },
    video: {
        options: {quality: 15, totalFrames: 60, framesPerSecond: 30}
    }
};


// -------------------------


const config = isDebugMode ? debug : defaults;
config.debug = isDebugMode;

export default config;






