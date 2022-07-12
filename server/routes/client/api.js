const express = require('express')
const router = express.Router();
const { getMovieRank, getMovies, getMovieBySlug, searchMovies } = require('../../client/movies');
const { getBooks, getBookBySlug, getChapBySlug, searchBooks } = require('../../client/books');
const { getFav, getAnnouncement, getAds, getPopup, getFacebook } = require('../../client/settings');
const { incrementView, setRating } = require('../../client/counter');
const keys = require('../../keys');
const fs = require('fs');
const path = require('path');


// UTILS
router.route('/rank')
    .get(async (req, res) => {
        const movies = await getMovieRank();

        if (movies) return res.status(200).json(movies);
        return res.sendStatus(400);
    })

router.route('/fav')
    .get(async (req, res) => {
        const fav = await getFav();

        if (fav) return res.status(200).json(fav);
        return res.sendStatus(400);
    })


router.route('/announcement')
    .get(async (req, res) => {
        const announcement = await getAnnouncement();

        if (announcement) return res.status(200).json({ text: announcement });
        return res.sendStatus(400);
    })


router.route('/ads')
    .get(async (req, res) => {
        const ads = await getAds();

        if (typeof ads === 'object' && Object.keys(ads).length > 1) {
            return res.status(200).json(ads);
        }

        return res.sendStatus(400);
    })

router.route('/popup')
    .get(async (req, res) => {
        const aadsIPs = ['5.9.113.137', '46.4.61.205', '213.239.217.45', '88.198.43.49'];
        if (aadsIPs.includes(req.ip)) return res.sendStatus(400);

        const popup = await getPopup();

        if (popup) return res.status(200).json(popup);
        return res.sendStatus(400);
    })

router.route('/facebook')
    .get(async (req, res) => {
        const facebook = await getFacebook();

        if (facebook) return res.status(200).json({ link: facebook });
        return res.sendStatus(400);
    })

router.route('/search')
    .get(async (req, res) => {
        let { q } = req.query || {};

        try {
            const [movies, books] = await Promise.all([
                searchMovies(q),
                searchBooks(q)
            ]);

            res.status(200).json({ movies, books })
        }
        catch (err) {
            if (keys.debug) console.log(err)
            res.status(200).json({ movies: [], books: [] })
        }
    })



// MOVIE
router.route('/movie')
    .get(async (req, res) => {
        const { page, limit, country } = req.query || {};
        const movies = await getMovies(page, limit, country);

        if (movies) return res.status(200).json(movies);
        return res.sendStatus(400);
    })

router.route('/movie/:slug')
    .get(async (req, res) => {
        const { slug } = req.params;

        const movie = await getMovieBySlug(slug);

        if (movie) {
            res.status(200).json(movie);
            incrementView('movie', movie._id.toString());

            return;
        }

        return res.sendStatus(400)
    })

router.route('/movie/:id/rate/:rating')
    .get(async (req, res) => {
        const { id, rating } = req.params;
        if (id && rating) setRating('movie', id, rating)

        res.sendStatus(200)
    })




// BOOK
router.route('/book')
    .get(async (req, res) => {
        const { page, limit } = req.query || {};
        const books = await getBooks(page, limit);

        if (books) return res.status(200).json(books);
        return res.sendStatus(400);
    })

router.route('/book/:slug')
    .get(async (req, res) => {
        const { slug } = req.params;

        const book = await getBookBySlug(slug);

        if (book) {
            res.status(200).json(book);
            incrementView('book', book._id.toString());

            return;
        }

        return res.sendStatus(400)
    })

router.route('/book/:slug/chap/:chapIndex')
    .get(async (req, res) => {
        const { slug, chapIndex } = req.params;

        if(!chapIndex && chapIndex !== 0) {
            return res.sendStatus(400)
        }

        const chap = await getChapBySlug(slug, chapIndex);

        if (chap) {
            const stream = fs.createReadStream(chap);

            res.status(200)
            stream.pipe(res)

            return;
        }

        return res.sendStatus(400)
    })


router.route('/book/:id/rate/:rating')
    .get(async (req, res) => {
        const { id, rating } = req.params;
        if (id !== 'undefined' && rating) {
            setRating('book', id, rating)
        }

        res.sendStatus(200)
    })

router.get('*', (req, res) => res.sendStatus(404));

module.exports = router;