const router = require('express').Router()
const auth = require('../../configs/auth')

const {announcement, ads, facebook} = require('../../admin/settings')

router.route('/announcement')
    .get(auth.required, async (req, res) => {
        const data = await announcement.get();

        if(data.announcement) return res.status(200).json(data)
        return res.sendStatus(400)
    })
    .post(auth.required, async (req, res) => {
        const data = await announcement.set(req.body);

        if(data.announcement) return res.status(200).json(data)
        return res.sendStatus(400)
    })

router.route('/ads')
    .get(auth.required, async (req, res) => {
        const data = await ads.get();

        if(typeof data == 'object' && Object.keys(data).length > 1)
            return res.status(200).json(data)
        else   
            return res.sendStatus(400)
    })
    .post(auth.required, async (req, res) => {
        const data = await ads.set(req.body);

        if(typeof data == 'object' && Object.keys(data).length > 1)
            return res.status(200).json(data)
        else
            return res.sendStatus(400)
    })

router.route('/facebook')
    .get(auth.required, async (req, res) => {
        const data = await facebook.get();

        if(data.facebook) return res.status(200).json(data)
        return res.sendStatus(400)
    })
    .post(auth.required, async (req, res) => {
        const data = await facebook.set(req.body);

        if(data.facebook) return res.status(200).json(data)
        return res.sendStatus(400)
    })

module.exports = router;