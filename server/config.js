module.exports = Object.assign({}, {
    port: 3000,
    mode: process.env.NODE_ENV ? process.env.NODE_ENV : "development",
    storageLocation: '../../uploads',
    publicLocation: '../dist/box-customizer',
    title: "Box-Customs",
    description: "Visit us for more great stuff."
}, process.env)