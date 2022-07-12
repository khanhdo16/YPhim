const router = require('express').Router();
const auth = require('../../configs/auth');
const { getImageById, getImages, searchImages, deleteImageById } = require('../../admin/images')
const { getAudioById, getAudios, searchAudios, deleteAudioById } = require('../../admin/audios')

router.route('/image')
    .get(auth.required, async (req, res) => {
        const { offset, limit, search } = req.query
        let images = null

        if(offset && limit) images = await getImages(offset, limit)
        if (search) images = await searchImages(search)

        if(images) return res.status(200).json(images)

        return res.sendStatus(400)
    })

router.route('/image/:id')
    .get(auth.required, async (req, res) => {
        const { id } = req.params
        const image = await getImageById(id)

        if(image) return res.status(200).json(image)

        return res.sendStatus(400)
    })
    .delete(auth.required, async (req, res) => {
        const { id } = req.params

        const deleted = await deleteImageById(id)

        if(deleted) return res.sendStatus(200)

        return res.sendStatus(400)
    })


router.route('/audio')
    .get(auth.required, async (req, res) => {
        const { offset, limit, search } = req.query
        let audios = null

        if(offset && limit) audios = await getAudios(offset, limit)
        if (search) audios = await searchAudios(search)
        if(audios) return res.status(200).json(audios)

        return res.sendStatus(400)
    })

router.route('/audio/:id')
    .get(auth.required, async (req, res) => {
        const { id } = req.params
        const audio = await getAudioById(id)

        if(audio) return res.status(200).json(audio)

        return res.sendStatus(400)
    })
    .delete(auth.required, async (req, res) => {
        const { id } = req.params

        const deleted = await deleteAudioById(id)

        if(deleted) return res.sendStatus(200)

        return res.sendStatus(400)
    })


module.exports = router