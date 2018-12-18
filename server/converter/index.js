var fs = require('fs');
const {promisify} = require('util');
var path = require('path');

const rm = promisify(fs.unlink)

const {convertTarToVideo} = require('./convertTarToVideo');


const m4vHighQualityConfig = {
    format: "m4v",
    output: {
        vcodec: 'libx264',
        pix_fmt: 'yuv420p',
        vf: "pad=ceil(iw/2)*2:ceil(ih/2)*2",
        preset: "veryslow",
        crf: "12"
    }
}

const mp4HighQualityConfig = {
    format: "mp4",
    output: {
        vcodec: 'libx264',
        pix_fmt: 'yuv420p',
        vf: "pad=ceil(iw/2)*2:ceil(ih/2)*2",
        preset: "veryslow",
        crf: "12"
    }
}


const jpgConfig = {
    format: "jpg",
    output: {
        vframes: 1,
        ss: '00:00:00.000'
    }
}

const tarArchiveInput30FPSConfig =
    {f: 'image2pipe', r: 30}


async function convertVideoContent(filename = "./files/input.tar",inputConfig, outputNameAndPathWithoutExt = './files/__output3', outputConfig, progressCallback) {


    if (!outputConfig) throw new Error("No output configuration defined.")

    console.log(outputConfig)


    /**
     * track progress and send to client
     */
        // ----------------------------------------

    var progress = require('progress-stream');

    var stat = fs.statSync(filename);
    var str = progress({
        length: stat.size,
        time: 50 /* ms */
    });

    str.on('progress', function (progress) {

        progressCallback({format: outputConfig.format, percentage: progress.percentage});

    });

    str.on('finish', function (progress) {

        progressCallback({format: outputConfig.format, percentage: 100});

    });

    // ----------------------------------------

    const fileReadStream = fs.createReadStream(filename).pipe(str)


    const outputName = outputNameAndPathWithoutExt + "." + outputConfig.format


    try {
        await rm(outputName)
    } catch (e) {
        console.warn("warning:", e.message);
    }


    return convertTarToVideo(fileReadStream, inputConfig, outputName, outputConfig.output)


}

module.exports = {
    convertVideoContent,
    outputConfigurations: {jpgConfig, m4vHighQualityConfig,mp4HighQualityConfig},
    inputConfigurations: {tarArchiveInput30FPSConfig}
}

