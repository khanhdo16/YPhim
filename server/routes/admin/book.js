const express = require('express')
const router = express.Router();
const auth = require('../../configs/auth')

const { 
    createBook, checkSlug, getBookBySlug,
    updateBookBySlug, notifyBookUpdate,
    getBooks, searchBooks, deleteBookBySlug,
    getBooksCount
} = require('../../admin/books');


router.route('/')
    .get(auth.required, async (req, res) => {
        const { page, limit, search } = req.query
        let books = null
        
        if(page && limit) books = await getBooks(page, limit)
        if (search) books = await searchBooks(search)
        if(books) return res.status(200).json(books)
        
        return res.sendStatus(400)
    })


router.route('/new')
    .post(auth.required, async (req, res) => {
        const data = req.body;
        const book = await createBook(data);

        if(book) {
            if(data.notif) notifyBookUpdate(book)
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
        const count = await getBooksCount();
        
        res.status(200).json({count: count ? count : 0})
    })

router.route('/:slug')
    .get(auth.required, async (req, res) => {
        const { slug } = req.params;
        const book = await getBookBySlug(slug);

        if(book) return res.status(200).json(book)

        return res.sendStatus(400);
    })
    .post(auth.required, async (req, res) => {
        const { slug } = req.params;
        const data = req.body;

        const book = await updateBookBySlug(slug, data);

        if(book) {
            if(data.notif) notifyBookUpdate(book)
            return res.status(200).json(book)
        }

        return res.sendStatus(400);
    })
    .delete(auth.required, async (req, res) => {
        const { slug } = req.params

        const deleted = await deleteBookBySlug(slug)

        if(deleted) return res.sendStatus(200)

        return res.sendStatus(400)
    })


module.exports = router