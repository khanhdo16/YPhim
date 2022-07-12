const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema({
    _id: String,
    announcement: String,
    popup: {
        image: String,
        url: String
    },
    banner1: {
        image: String,
        url: String
    },
    banner2: {
        image: String,
        url: String
    },
    aads1: String,
    aads2: String,
    aads3: String,
    other1: String,
    other2: String,
    other3: String,
    fav: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Movie'
    },
    facebook: String,
    sitemap: String
})

module.exports = mongoose.model('Settings', settingsSchema)