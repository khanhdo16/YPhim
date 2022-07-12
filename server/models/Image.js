const mongoose = require('mongoose')
const path = require('path')
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');


//Schema for Image
const imageSchema = new mongoose.Schema({
    imgurId: {
        type: String,
        required: true,
    },
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

imageSchema.virtual('resize')
    .get(function() {
        const sizes = ['', 's', 'b', 't', 'm', 'l', 'h'];
        const output = {};
        const url = (size) => {
            return `https://i.imgur.com/${this.imgurId}${size}${path.extname(this.url)}`
        }

        sizes.forEach(size => {
            output[size === '' ? 'o' : size] = url(size);
        });

        return output;
    })


imageSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model('Image', imageSchema)