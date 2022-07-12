const Movie = require('../models/Movie');
const keys = require('../keys');
const escapeRegexp = require('escape-string-regexp-node');



const getMovieRank = async () => {
    try {
        let movies = await Movie.find(
            {published: true},
            '_id title slug image country views.weekly rating'
        )
        .sort('-views.weekly -rating.guest -rating.yu')
        .limit(10)
        .populate('image')
        .lean({virtuals: true})

        if(movies) {
            movies = movies.map(movie => {
                const {image, rating, views, id, ...rest} = movie;

                return {
                    ...rest,
                    image: image.resize,
                    rating: rating.total,
                    views: views.weekly
                }
            })
        }

        return movies;
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getMovies = async (page = 1, limit = 10, country) => {
    const query = {
        published: true,
        ...country && ({country})
    };

    try {
        const movies = await Movie.paginate(
            query,
            {
                select: '_id title slug image latest episodes completed',
                sort: '-date',
                populate: 'image',
                page: page,
                limit: limit,
                lean: {virtuals: true}
            }
        )

        if(movies) {
            const { docs, hasNextPage } = movies;

            return {
                movies: docs.map(doc => {
                    const {episodes, image, ...rest} = doc;

                    return {
                        ...rest,
                        image: image.resize
                    }
                }),
                hasNextPage
            }
        }

        return movies;
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getMovieBySlug = async (slug) => {
    try {
        const movie = await Movie.findOne(
            { slug: slug, published: true },
            '-__v',
            { 
                populate: 'image',
                lean: { virtuals: true}
            }
        )

        if(movie) {
            const { image, rating, views, published, slug, ...rest } = movie;
            const { _id, id, ...viewsRest } = views;

            return {
                ...rest,
                image: image.resize,
                rating: rating.total,
                views: viewsRest
            }
        }

        return movie;
    }
    catch (err) {
        if(keys.debug) console.log(err)
        return null;
    }
}

const searchMovies = async (search = '') => {
    const escaped = escapeRegexp(search);

    try {
        const movies = await Movie.find(
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
            '_id title slug image latest episodes completed',
            {
                populate: 'image',
                lean: { virtuals: true },
            }
        )

        if(movies) {
            return movies.map(movie => {
                const { image, episode, ...rest } = movie;

                return {
                    ...rest,
                    image: image.resize,
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
    getMovieRank,
    getMovies,
    getMovieBySlug,
    searchMovies
}