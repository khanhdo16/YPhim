const Book = require('../models/Book');
const keys = require('../keys');
const escapeRegexp = require('escape-string-regexp-node');
const path = require('path');


const getBooks = async (page = 1, limit = 10) => {
    try {
        const books = await Book.paginate(
            {published: true},
            {
                select: '_id title slug image latest chapters completed',
                sort: '-date',
                populate: 'image',
                page: page,
                limit: limit,
                lean: {virtuals: true}
            }
        )

        if(books) {
            const { docs, hasNextPage } = books;

            return {
                books: docs.map(doc => {
                    const {chapters, image, ...rest} = doc;

                    return {
                        ...rest,
                        image: image.resize
                    }
                }),
                hasNextPage
            }
        }

        return books;
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getBookBySlug = async (slug) => {
    try {
        const book = await Book.findOne(
            { slug: slug, published: true },
            '-__v -chapters.content -chapters.obfuscated',
        )
        .populate({
            path: 'image',
            options: {lean: {virtuals: true}},
        })
        .populate({
            path: 'chapters',
            populate: {
                path: 'image music',
                options: {lean: {virtuals: true}},
            }
        })
        .lean({virtuals: true})



        if(book) {
            const { chapters, image, rating, views, published, slug, ...rest } = book;
            const { _id, id, ...viewsRest } = views;

            const newChapters = chapters.map(chapter => {
                let { music, image, ...rest } = chapter;

                if(music) music = music.url.replace(path.join(__dirname, '../public/uploads'), '/audio');

                if(image) image = image.resize;

                return {
                    music,
                    image,
                    ...rest
                }
            })

            return {
                ...rest,
                image: image.resize,
                rating: rating.total,
                views: viewsRest,
                chapters: newChapters,
            }
        }

        return book;
    }
    catch (err) {
        if(keys.debug) console.log(err)
        return null;
    }
}

const getChapBySlug =  async (slug, chapIndex) =>{
    try {
        const book = await Book.findOne(
            { slug: slug,published: true },
            {
                chapter: {
                    $arrayElemAt: ["$chapters", Number(chapIndex)]
                }
            },
        )
        .lean({virtuals: true})

        if(book) {
            const { obfuscated } = book.chapter;

            return obfuscated
        }

        return book;
    }
    catch (err) {
        if(keys.debug) console.log(err)
        return null;
    }
}

const searchBooks = async (search = '') => {
    const escaped = escapeRegexp(search);

    try {
        const books = await Book.find(
            {
                $or: [
                    {
                        title: {
                            "$regex": escaped,
                            "$options": "i"
                        }
                    },
                    {
                        search: {
                            "$regex": escaped,
                            "$options": "i"
                        }
                    }
                ]
            },
            '_id title slug image latest chapters completed',
        )
        .populate({
            path: 'image',
            options: {lean: {virtuals: true}},
        })
        .populate({
            path: 'chapters',
            populate: {
                path: 'image music',
                options: {lean: {virtuals: true}},
            }
        })
        .lean({virtuals: true})

        

        if(books) {
            return books.map(book => {
                const {chapters, image, ...rest} = book;

                return {
                    ...rest,
                    image: image.resize
                }
            })
        }

        return []
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

module.exports = {
    getBooks,
    getBookBySlug,
    getChapBySlug,
    searchBooks
}