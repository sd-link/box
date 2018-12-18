const fs = require('fs');
const validate = require('uuid-validate');
const path = require('path');
const {convertVideoContent, outputConfigurations, inputConfigurations} = require('./converter');


function getOrigin(req) {
    return req.protocol + '://' + req.headers.host

}

async function deleteFile(filename) {
    return new Promise(function (resolve, reject) {

        fs.stat(filename, function (err, stats) {

            if (err) {
                reject(err);
            }

            fs.unlink(filename, function (err) {
                if (err) reject(err);

                resolve();

            });
        });
    })
}


async function convertTarToTargetFormats(tarFilename, progressCallback) {


    var targetFilename = path.dirname(tarFilename) + "/" + path.basename(tarFilename, ".tar") //+ "." + format;

    console.log("targetFilename", targetFilename)

    await convertVideoContent(tarFilename, inputConfigurations.tarArchiveInput30FPSConfig, targetFilename, outputConfigurations.mp4HighQualityConfig, progressCallback)


    //TODO pipe progress does not finish for jpg ... but only with 120 frames settings ..
    // if only 2 frames are inside the tar it will return a finish event
    setTimeout(() => {
        progressCallback({format: outputConfigurations.jpgConfig.format, percentage: 100})
    }, 1000)

    await convertVideoContent(tarFilename, inputConfigurations.tarArchiveInput30FPSConfig, targetFilename, outputConfigurations.jpgConfig, progressCallback)


}

/**
 * Make sure that the id sent to server is valid, otherwise reject.
 *
 * @param res
 * @param req
 * @param next
 */
function validateID(res, req, next) {
    const result = validate.version(req.params.id)
    if (result == 4) {
        next()
    }
    else
        res.status(404)
            .send('Not found');

}

/**
 * Add basic CORS headers.
 *
 * @param req
 * @param res
 * @param next
 */
function basicCORSHeaders(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
}


module.exports = {getOrigin, deleteFile, convertTarToTargetFormats, validateID, basicCORSHeaders}