const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require('../../configs/auth');
const { storage } = require('../../configs')
const { uploadImage } = require('../../admin/images')
const { uploadAudio } = require('../../admin/audios')

const dayjs = require('dayjs')
const User = require('../../models/User')


const authRouter = require('./auth');
const mediaRouter = require('./media');
const movieRouter = require('./movie');
const bookRouter = require('./book');
const settingsRouter = require('./settings');



/* SIGN IN */
router.route('/signin')
  .post((req, res, next) => {
    passport.authenticate('user',
      (err, user, info) => {
        if (err) {
          return res.status(400).json({ message: 'Lỗi, vui lòng thử lại sau.' })
        }

        if (!user) {
          return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' })
        }

        req.logIn(user, function (err) {
          if (err) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' })
          }
          else {
            if (req.body.rememberme) {
              req.session.cookie.expires = dayjs().add(1, "month").toDate()
            }
            else {
              req.session.cookie.expires = false
            }

            return res.status(200).json({ message: "Đăng nhập thành công!" })
          }
        })
      })(req, res, next)
  })


/* LOGOUT */
router.get('/logout', (req, res) => {
  req.logout()
  res.sendStatus(200)
})

router.route('/upload')
  .post(auth.required, uploadImage,
    storage.single('audio'), uploadAudio
  );


router.use('/auth', authRouter);
router.use('/media', mediaRouter);
router.use('/movie', movieRouter);
router.use('/book', bookRouter);
router.use('/settings', settingsRouter);


module.exports = router;


// router.route('/signup')
//   .post((req, res) => {
//     let data = req.body
//     const password = data.password

//     delete data.password

//     User.register(data, password, (err, result) => {
//       if(err) console.log(err)
//       else res.sendStatus(200)
//     })
//   })