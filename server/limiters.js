const rateLimit = require("express-rate-limit");
const config = require('./config')
const multer = require('multer');
const fs = require('fs');
const uuidv4 = require('uuid/v4');


/**
 * Limit file uploads to 5 per hour and ip.
 * @type {rateLimit}
 */
const createGIFLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // start blocking after 5 requests
    message: {error: "Too many GIFs created from this IP, please try again after an hour"}
});


/**
 * Limit API calls to 100 per hour and ip
 * @type {rateLimit}
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {error: "Too many API calls from this IP, please try again after an hour"}
});


/**
 * Describe storage location for uploaded files.
 * Note: Uploaded files will be renamed with random uuid-v4
 * @type {*|DiskStorage}
 */
var tarStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        var dir = config.storageLocation; //'./uploads';

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        callback(null, dir);
    },
    filename: function (req, file, callback) {


        const newFileName = uuidv4() + ".tar";


        callback(null, newFileName);
    }
});


module.exports = {createGIFLimiter, apiLimiter, tarStorage}