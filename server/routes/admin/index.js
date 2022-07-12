const express = require('express');
const router = express.Router();
const path = require('path');
const { regenerateSitemap } = require('../../configs/sitemap');


const apiRouter = require('./api');

// ADMIN ROUTER
router.use(express.static(path.join(__dirname, '/../../../admin', 'build')))


router.use('/api', apiRouter);
router.get('/update-sitemap', (req, res) => {
  regenerateSitemap();
  res.sendStatus(200);
})

router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/../../../admin/build', 'index.html'));
});


module.exports = router;