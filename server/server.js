const express = require('express');
const fs = require('fs');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const {basicCORSHeaders} = require("./util");
const {apiLimiter} = require("./limiters");
const config = require('./config')
const twitterRouter = require("./twitterRouter")(config)
const apiRouter = require('./router');

app.io = io;


/**
 * Some basic io feedback.
 */
io.on('connection', function (socket) {
    io.emit('this', {will: 'be received by everyone'});

    /*  socket.on('private message', function (from, msg) {
          console.log('I received a private message by ', from, ' saying ', msg);
      });*/

    socket.on('disconnect', function () {
        io.emit('user disconnected');
    });
});


server.listen(config.port);
// WARNING: app.listen(80) will NOT work here!

app.set('view engine', 'ejs');
app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)

app.use(basicCORSHeaders);
app.use("/", express.static(config.publicLocation));
app.use("/images", express.static(config.storageLocation));
app.use("/api", apiLimiter, apiRouter);
app.use('/twitter', apiLimiter, twitterRouter)


console.log("server started, listening on port:", config.port);
//console.log("---- server config ----")
//console.log(config)


