const mongoose = require('mongoose')

//Schema for Audio
const audioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
})

module.exports = mongoose.model('Audio', audioSchema)