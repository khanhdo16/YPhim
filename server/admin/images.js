const Image = require('../models/Image')
const fetch = require('node-fetch')
const keys = require('../keys');
const escapeRegexp = require('escape-string-regexp-node');



const uploadImage = (req, res, next) => {
    const { length } = Object.keys(req.body)
    if(req.body && length > 0) {
      const image = req.body
      const { imgurId } = image || {}
      const { access_token } = req.user.imgur || {}
  
      image.date = new Date()
  
      Image.create(image, (err, image) => {
        if(err && access_token) {
          fetch(`https://api.imgur.com/3/image/${imgurId}`,{
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${access_token}`}
          })
          .then(() => {
            return res.sendStatus(400)
          })
        }
  
        if(image) return res.sendStatus(200)
      })
    }
    else return next()
}

const getQuerySkip = (offset, [limit, setLimit], count) => {
    if(offset === 0) {
        let skip = count - limit

        if (skip < 0) {
            setLimit(count - offset)
            return 0
        }

        return skip
    }

    if(offset > 0) {
        if (offset + limit > count ) {
            setLimit(count - offset)
            return 0
        }
        if (count > offset) {
            return count - offset - limit
        }
        if (count === offset) {
            return 0
        }
    }
}

const getImageById = async (id) => {
    try {
        const image = await Image.findById(
            id,
            {'__v': false},
            {lean: {virtuals: true}}
        )

        return image
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getImages = async (offset, limit) => {
    try {
        const count = await Image.estimatedDocumentCount()
        const queryOffset = Number(offset)
        let queryLimit = Number(limit)
        const setLimit = (number) => { queryLimit = number }
        const skip = getQuerySkip(queryOffset, [queryLimit, setLimit], count)
        let images = []

        if(count > queryOffset) {
            images = await Image.find(
                {},
                {'__v': false},
                {
                    lean: {virtuals: true},
                    skip: skip,
                    limit: queryLimit,
                }
            )

            images.reverse()
        }

        return images
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const searchImages = async (search = '') => {
    const escaped = escapeRegexp(search);

    try {
        const images = await Image.find(
            {name: {
                "$regex": escaped,
                "$options": "i"
            }},
            {'__v': false},
            {lean: {virtuals: true}}
        )

        return images
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const deleteImageById = async (id) => {
    try {
        const image = await Image.findByIdAndDelete(id, {lean: {virtuals: true}})

        return image
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

module.exports = {
    uploadImage,
    getImageById,
    getImages,
    searchImages,
    deleteImageById,
}