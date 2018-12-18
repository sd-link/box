

const multer = require('multer');
const router = require('express').Router();
const config = require('./config')
const path = require('path');
const {createGIFLimiter,  tarStorage} = require("./limiters");
const {getOrigin, deleteFile, convertTarToTargetFormats, validateID} = require("./util");


/**
 * Route that generates the meta tags for open graph interoperability.
 * Note: The :id is the base filename of the uploaded gif.
 */
router.get('/share/:id/:format?', validateID, (req, res) => {


    const origin = getOrigin(req) //req.protocol + '://' + req.headers.host
    //check for valid uuid
    const url = origin + req.originalUrl;


    const available = ["gif", "m4v", "mp4"]
    let format = req.params.format ? req.params.format.replace(/[^a-z0-9]/gi, '') : "gif";


    if (available.indexOf(format) < 0) {

        res.status(404)        // HTTP status 404: NotFound
            .send('Not found');

        return
    }


    if (format == "gif")
        res.render('template', {
            image: origin + "/images/" + req.params.id + ".gif",
            title: config.title,
            description: config.description,
            origin,
            url
        })
    else //if (format == "m4v")
        res.render('template-video', {
            image: origin + "/images/" + req.params.id + ".jpg",
            video: origin + "/images/" + req.params.id + "." + format,//".m4v",
            title: config.title,
            description: config.description,
            origin,
            url
        });


});


var uploadTar = multer({storage: tarStorage}).single('files'); //.array('files', 12);

router.post('/uploadTar', createGIFLimiter, function (req, res, next) {

    uploadTar(req, res, function (err) {
        if (err) {
            return res.send({error: "Something went wrong while uploading TAR"});
        }

        const id = req.file.filename.split(".")[0]

        let tarFilename = path.resolve(__dirname, config.storageLocation + "/" + id + ".tar")

        console.log("---- saved to ----")
        console.log(tarFilename)

        // preemptively return to client
        // TODO find a better way to return the data for the sharing url early but still be flexible with file formats
        res.send({
            //path: req.file.path,
            id, format: "mp4"// mConfig.format
        })


        convertTarToTargetFormats(tarFilename, function progressCallback(data) {

            req.app.io.emit('convert-progress', data);

        })

    });
})


/**
 * TODO filter directory for files with name == id
 * TODO use either node-cache or store for IPs to prevent that wrong person deletes content
 * FIXME if file age > 2minutes ago => error no longer allowed
 * - to be able a file a token is needed that has to be sent when  uploading it
 * - alternativly it might be easier to only allow deleting a file for a small amount of time
 *   in which case 2 minutes after uploading it should be sufficient
 */

router.get('/delete/:id', validateID, (req, res) => {
    const baseFile = config.storageLocation + "/" + req.params.id
    deleteFile(baseFile + ".gif")
})


module.exports = router;