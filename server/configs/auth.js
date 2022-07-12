const passport = require('passport')

const User = require("../models/User.js")

const auth = {
    config: () => {
        passport.use('user', User.createStrategy())
        
        passport.serializeUser((obj, done) => {
            if (obj != null) {
                done(null, obj)
            }
            else {
                done(new Error('Invalid user.'), null)
            }
        })

        passport.deserializeUser(async (obj, done) => {
            try {
                const { _id } = obj;
                const user = await User.findById(_id);

                if (!user) done(new Error('Invalid user.'), null); // no user found

                done(null, user);
            } catch (err) {
                done(err, null)
            }
        })
    },
    required: (req, res, next) => {
        if (req.user)
            return next();
        else
            return res.sendStatus(401)
    }
}

module.exports = auth