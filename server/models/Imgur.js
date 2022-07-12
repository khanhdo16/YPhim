const mongoose = require('mongoose')

const imgurSchema = new mongoose.Schema({
    access_token: {
        type: String,
        required: true
    },
    expires_in: {
        type: String,
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    },
    account_username: {
        type: String,
        required: true
    },
    account_id: {
        type: String,
        required: true
    },
    date_obtained: {
        type: Number,
        required: true
    }
})

module.exports = imgurSchema 