const Audio = require('../models/Audio')
const fs = require('fs')
const keys = require('../keys');
const escapeRegexp = require('escape-string-regexp-node');

const uploadAudio = (req, res) => {
    if(req.file) {
      const { originalname, path: url, size, mimetype } = req.file || {}

      const audio = {
        name: originalname,
        url: url,
        type: mimetype,
        size: size,
        date: new Date()
      }

      Audio.create(audio, (err, audio) => {
        if(err) {
          fs.unlinkSync(url)
          return res.sendStatus(400)
        }

        if(audio) {
          return res.sendStatus(200)
        }
      })
    }
    else res.sendStatus(400)
}

const getQuerySkip = (offset, [limit, setLimit], count) => {
    if(offset === 0) {
        const skip = count - limit

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

const getAudioById = async (id) => {
    try {
        const audio = await Audio.findById(
            id,
            {'__v': false},
            {lean: {virtuals: true}}
        )

        return audio
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getAudios = async (offset, limit) => {
    try {
        const count = await Audio.estimatedDocumentCount()
        const queryOffset = Number(offset)
        let queryLimit = Number(limit)
        const setLimit = (number) => { queryLimit = number }
        const skip = getQuerySkip(queryOffset, [queryLimit, setLimit], count)
        let audios = []

        if(count > queryOffset) {
            audios = await Audio.find(
                {},
                {'__v': false},
                {
                    lean: {virtuals: true},
                    skip: skip,
                    limit: queryLimit,
                }
            )

            audios.reverse()
        }

        return audios
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const searchAudios = async (search = '') => {
    const escaped = escapeRegexp(search);

    try {
        const audios = await Audio.find(
            {name: {
                "$regex": escaped,
                "$options": "i"
            }},
            {'__v': false},
            {lean: {virtuals: true}}
        )

        return audios
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const deleteAudioById = async (id) => {
    try {
        const audio = await Audio.findById(id)

        fs.unlinkSync(audio.url)

        audio.remove()
        
        return audio
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

module.exports = {
    uploadAudio,
    getAudioById,
    getAudios,
    searchAudios,
    deleteAudioById,
}