const router = require('express').Router();
const auth = require('../../configs/auth')
const keys = require('../../keys')
const fetch = require('node-fetch')

const User = require('../../models/User')

/* AUTHENTICATED */
router.get('/', async (req, res) => {
    if(req.user) {
        const user = req.user

        const imgur = await validateImgur(user)

        const data = {
            username: user.username,
            fname: user.fname,
            lname: user.lname,
            expires: req.session.cookie.expires,
            imgur: imgur != null ? imgur : user.imgur
        }

        res.status(200).json(data)
    }
    else (
        res.sendStatus(401)
    )
})


router.route('/imgur')
    .post(auth.required, async (req, res) => {
        const result = await updateImgurAccessToken(req.user._id, req.body)

        if (result) {
            res.sendStatus(200)
        }
        else {
            res.sendStatus(400)
        }
    })


async function updateImgurAccessToken(id, data) {
    data.date_obtained = new Date()

    const query = User.findByIdAndUpdate(
        id,
        { imgur: data },
        { 
            runValidators: true,
                context: 'query',
            returnDocument: 'after' 
        },
    )

    try {
        const user = await query.exec()
        return user.imgur
    }
    catch(err) {
        if(keys.debug) console.log(err)
    }
}

async function validateImgur(user) {
    if (user.imgur) {
        const { refresh_token, expires_in, date_obtained } = user.imgur
        const current = Date.now() - 60 * 1000
        const expiration = date_obtained + Number(expires_in) * 1000

        if(current === expiration) {
            const options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    refresh_token: refresh_token,
                    client_id: keys.imgur.clientId,
                    client_secret: keys.imgur.clientSecret,
                    grant_type: 'refresh_token'
                })
            };

            try {
                const response = await fetch('https://api.imgur.com/oauth2/token', options);

                const data = await response.json()

                const result = await updateImgurAccessToken(user._id, data)

                return result
            }
            catch(e) {
                if(keys.debug) console.log(e)
            }
        }
    }
}


module.exports = router