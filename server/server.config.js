module.exports = {
    apps : [{
        name        : "goat-server",
        script      : "./server.js",
        watch       : true,
        //instances  : 4,
        //exec_mode  : "cluster",
        env: {
            "NODE_ENV": "development",
            consumerKey: 'GMZuCbVuuaPTUu3OaUFMvJKAr',
            consumerSecret: 'CxImVBSMDTBTQN5NaMbrvLCNoqy9KIPzBKHz9rBNVYV0c7irYu',
            callbackURL: '/twitter/return'
        },
        env_production : {
            "NODE_ENV": "production",
            consumerKey: 'SHyL0sMzWCdrIKzyvMf91H5Pw',
            consumerSecret: 'X9rSzrql0mblaB0fqjUacFLDXj1EfANDLG9OGbejroQAkb6m5v',
            callbackURL: '/twitter/return'
        }
    }]
}