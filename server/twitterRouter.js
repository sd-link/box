const {getOrigin} = require("./util");
const config0 = require('./config')
var express = require('express');
var path = require('path');

var userTokenStore = require('store')
var expirePlugin = require('store/plugins/expire')
userTokenStore.addPlugin(expirePlugin)

//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var session = require('express-session');

const twitterRouter = express.Router()

let config; //set when required //config.storageLocation

// FIXME use dynamic approach instead
// @see https://stackoverflow.com/questions/14111850/passport-facebook-how-to-dynamically-set-callbackurl

//TODO place keys in .env some additional security
const availKeys = {
    development: {
        consumerKey: 'GMZuCbVuuaPTUu3OaUFMvJKAr',
        consumerSecret: 'CxImVBSMDTBTQN5NaMbrvLCNoqy9KIPzBKHz9rBNVYV0c7irYu',
        callbackURL: '/twitter/return'
    },
    production: {
        consumerKey: 'SHyL0sMzWCdrIKzyvMf91H5Pw',
        consumerSecret: 'X9rSzrql0mblaB0fqjUacFLDXj1EfANDLG9OGbejroQAkb6m5v',
        callbackURL: '/twitter/return'
    }
}

const keys = config0.mode=="production"? availKeys.production: availKeys.development
console.log("keys:",keys)

passport.use(new Strategy(keys, function (token, tokenSecret, profile, callback) {

    const expires = new Date().getTime() + 1000 * 360

    userTokenStore.set(profile.id, {token, tokenSecret}, expires)
    return callback(null, profile);
}));

passport.serializeUser(function (user, callback) {
    callback(null, user);
})

passport.deserializeUser(function (obj, callback) {
    callback(null, obj);
})


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
twitterRouter.use(logger('dev'));
twitterRouter.use(bodyParser.json());
twitterRouter.use(bodyParser.urlencoded({extended: false}));
twitterRouter.use(cookieParser());
//twitterRouter.use(express.static(path.join(__dirname, 'public')));
twitterRouter.use(session({secret: 'whatever', resave: true, saveUninitialized: true}))
twitterRouter.use(passport.initialize())
twitterRouter.use(passport.session())


twitterRouter.get('/', function (req, res) {
    res.render('twitter/index', {user: req.user})
})

twitterRouter.use('/video/:id', function (req, res) {

//TODO twitter/video/:id
// => redirect /login
    let filename = req.params.id
    req.session.currentVideo = filename
    if (req.user) {

        res.redirect("../tweet")

    }
    else res.redirect("../login")
})


function passportAuthTwitterDynamic(req, res, next) {

    let origin=getOrigin(req)

    passport.authenticate(
        'twitter', {
            callbackURL: origin+ keys.callbackURL,
            failureRedirect: '/',
            // session: false
        })(req, res, next);
}


twitterRouter.get('/login', passportAuthTwitterDynamic)


twitterRouter.get('/return', passportAuthTwitterDynamic, function (req, res) {
    res.redirect('tweet')
})






twitterRouter.get('/tweet', function (req, res) {

    let filename = req.session.currentVideo

//TODO better relative route to storage
    res.render('twitter/tweet', {user: req.user, video: {url: "/images/"+filename}})

})


twitterRouter.post('/tweet/send', function (req, res) {


    const user = userTokenStore.get(req.user.id)

    if (!user) {
        res.redirect("/");
        return;
    }

    const message = req.body.tweet


    console.log(user)
    var Twit = require('twit')

    var T = new Twit({
        consumer_key: keys.consumerKey,
        consumer_secret: keys.consumerSecret,
        access_token: user.token,
        access_token_secret: user.tokenSecret,
        timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
        strictSSL: true,     // optional - requires SSL certificates to be valid.
    })

    let filename = req.session.currentVideo
    var filePath = path.resolve(__dirname, config.storageLocation,filename)
    console.log(filePath)


    T.postMediaChunked({file_path: filePath}, function (err, data, response) {
        console.log("postMediaChunked-callback", JSON.stringify(data))

        // now we can assign alt text to the media, for use by screen readers and
        // other text-based presentations and interpreters
        var mediaIdStr = data.media_id_string
        // TODO @7frank  find a better solution to the pendig state of the response

        setTimeout(() => createTweet(message, mediaIdStr, res, T), 2000)

    })


})

function createTweet(message, mediaIdStr, res, T) {

    message += " http://goat.invision3d.org"

    var altText = "Miniature figure customizer."
    var meta_params = {media_id: mediaIdStr, alt_text: {text: altText}}

    T.post('media/metadata/create', meta_params, function (err, data, response) {

        if (!err) {
            // now we can reference the media and post a tweet (media will attach to the tweet)
            var params = {status: message, media_ids: [mediaIdStr]}

            T.post('statuses/update', params, function (err, data, response) {

                res.render('twitter/close', data)
                //res.json(data)
            })


        }
        else
            console.warn(err)
    })

}

module.exports = function (conf,orig) {
    config = conf
   // origin = orig
    return twitterRouter
}