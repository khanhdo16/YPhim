const router = require('express').Router();
const auth = require('../../configs/auth')

const { 
    createMovie, checkSlug, getMovieBySlug,
    updateMovieBySlug, notifyMovieUpdate,
    getMovies, searchMovies, deleteMovieBySlug,
    getMoviesCount
} = require('../../admin/movies');

const { fav } = require('../../admin/settings');


router.route('/')
    .get(auth.required, async (req, res) => {
        const { page, limit, search } = req.query
        let movies = null
        
        if(page && limit) movies = await getMovies(page, limit)
        if (search) movies = await searchMovies(search)
        if(movies) return res.status(200).json(movies)
        
        return res.sendStatus(400)
    })


router.route('/new')
    .post(auth.required, async (req, res) => {
        const data = req.body;
        const movie = await createMovie(data);

        if(movie) {
            if(data.notif) notifyMovieUpdate(movie)
            return res.sendStatus(200);
        }
        
        return res.sendStatus(400);
    })

router.route('/check-slug')
    .post(auth.required, async (req, res) => {
        const { slug } = req.body;
        const existed = await checkSlug(slug);

        if(existed) return res.sendStatus(400)

        return res.sendStatus(200);
    })

router.route('/count')
    .get(auth.required, async (req, res) => {
        const count = await getMoviesCount();
        
        res.status(200).json({count: count ? count : 0})
    })

router.route('/fav')
    .get(auth.required, async (req, res) => {
        const { fav: id } = await fav.get();

        if(id) return res.status(200).json({_id: id})
        return res.sendStatus(400)
    })
    .post(auth.required, async (req, res) => {
        const { id } = req.body
        const success = await fav.set(id);

        if(success) return res.sendStatus(200)
        return res.sendStatus(400)
    })

router.route('/:slug')
    .get(auth.required, async (req, res) => {
        const { slug } = req.params;
        const movie = await getMovieBySlug(slug);

        if(movie) return res.status(200).json(movie)

        return res.sendStatus(400);
    })
    .post(auth.required, async (req, res) => {
        const { slug } = req.params;
        const data = req.body;

        const movie = await updateMovieBySlug(slug, data);

        if(movie) {
            if(data.notif) notifyMovieUpdate(movie)
            return res.status(200).json(movie)
        }

        return res.sendStatus(400);
    })
    .delete(auth.required, async (req, res) => {
        const { slug } = req.params

        const deleted = await deleteMovieBySlug(slug)

        if(deleted) return res.sendStatus(200)

        return res.sendStatus(400)
    })

module.exports = router