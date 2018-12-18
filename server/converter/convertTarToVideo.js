var tar = require('tar-stream')
var path = require('path');

//const ffProcPath = path.resolve(__dirname, 'ffmpeg/bin/ffmpeg.exe')
//process.env.FFMPEG_PATH = ffProcPath

var ffmpeg = require('ffmpeg-stream').ffmpeg

/**
 *
 *
 * @param fileReadStream - tar stream
 * @param output - filename and path
 * @param outputConfig config options
 */
function convertTarToVideo(fileReadStream, inputConfig, output, outputConfig) {

    return new Promise(function (resolve, reject) {


        const extract = tar.extract()

        fileReadStream.pipe(extract)


        const conv = ffmpeg() // create converter
        const input = conv.input(inputConfig) // create input writable stream
        conv.output(output, outputConfig) // output to file


        input.on('error', reject)

        // TODO can't pipe output
        //conv.output(outputConfig)
        //    .pipe(fs.createWriteStream(output))

        extract.on('entry', function (header, stream, next) {

            // header is the tar header
            // stream is the content body (might be an empty stream)
            // call next when you are done with this entry

            stream.pipe(input, {end: false})


            stream.on('end', function () {
                next() // ready for next entry
            })

            stream.resume() // just auto drain the stream

        })

        extract.on('error', reject)
        extract.on('finish', function () {
            input.end()
            console.log("extract finished " + output)
            resolve();

        })

        conv.run()

    })


}

module.exports = {convertTarToVideo}