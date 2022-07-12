const Movie = require('../models/Movie');
const keys = require('../keys');
const fetch = require('node-fetch');
const escapeRegexp = require('escape-string-regexp-node');



const createMovie = async (data) => {
    try {
        const movie = await Movie.create(data);
        return movie;
    }
    catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const getMovies = async (page = 1, limit = 10) => {
    try {
        const movies = await Movie.paginate(
            {},
            {
                select: 'title slug image published views date',
                sort: '-date',
                populate: 'image',
                page: page,
                limit: limit,
                lean: {virtuals: true}
            }
        )

        if(movies) {
            const { docs, totalDocs } = movies;

            return {
                docs: docs.map(doc => {
                    const {image, ...rest} = doc;

                    return {
                        ...rest,
                        image: image.resize
                    }
                }),
                totalDocs
            }
        }

        return movies;
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
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
            'title slug image published views date',
            {
                populate: 'image',
                lean: {virtuals: true}
            }
        )
        
        if(movies) {
            return movies.map(movie => {
                const {image, ...rest} = movie;

                return {
                    ...rest,
                    image: image.resize
                }
            })
        }

        return movies
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getMovieBySlug = async (slug) => {
    try {
        const movie = await Movie.findOne(
            { slug: slug },
            { '__v': false },
            { lean: {virtuals: true} }
        ).populate({
            path: 'image',
            options: {lean: {virtuals: true}}
        });

        return movie;
    }
    catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const updateMovieBySlug = async (slug, data) => {
    try {
        const movie = await Movie.findOneAndUpdate(
            {slug: slug},
            data,
            { 
                runValidators: true,
                context: 'query',
                returnDocument: 'after',
                lean: {virtuals: true} 
            }
        );
        return movie;
    }
    catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const deleteMovieBySlug = async (slug) => {
    try {
        const movie = await Movie.findOneAndDelete({slug: slug})
        return movie
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getMoviesCount = async () => {
    try {
        const count = await Movie.estimatedDocumentCount();
        return count
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return 0;
    }
}

async function checkSlug(slug)  {
    try {
        const existed = await Movie.exists({ slug: slug });
        return existed;
    }
    catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

function getQuerySkip(offset, [limit, setLimit], count) {
    if(offset === 0) {
        const skip = count - limit

        if (skip < 0) {
            setLimit(count - offset)
            return 0
        }

        return skip
    }

    if(offset > 0) {
        if (offset + limit > count ) {
            setLimit(count - offset)
            return 0
        }
        if (count > offset) {
            return count - offset - limit
        }
        if (count === offset) {
            return 0
        }
    }
}



// Notification functions

const setPostData = (type, data) => {
    const { title, image } = data.notification;

    switch(type) {
        case 'android':
            const android = {
                ...data,
                to: '/topics/tap_moi_android',
                notification: {
                    ...data.notification,
                    content_available: true,
                    android_channel_id: 'Default channel'
                },
                webpush: {
                    headers: {
                      Urgency: 'high'
                    }
                },
                android: {
                    priority: 'high'
                },
                data: {
                    ...data.data,
                    id: 'xCfUzL4cdQ',
                    post_title: title,
                    post_image: image,
                    post_message: 'Tập mới đó! Đi coi bede, đi coi bede kìa :))',
                }
            }
        
            return android;
        case 'ios':
            const ios = {
                ...data,
                to: '/topics/tap_moi_ios',
                'content-available': true,
                notification: {
                    ...data.notification,
                    badge: 1
                }
            }
        
            return ios;
        default:
            return {}
    }
    
}

const sendPushRequest = (type, data) => {   
    const url = 'https://fcm.googleapis.com/fcm/send';
    const postData = setPostData(type, data);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keys.fcm}`
        },
        body: JSON.stringify(postData)
    })
}

const notifyMovieUpdate = async (data) => {
    try {
        let { title, image, slug } = data;
        const { url } = image || {};

        const postData = {
            'collapse_key': 'type_a',
            'notification': {
                'title': title,
                'body': 'Tập mới đó! Đi coi bede, đi coi bede kìa :))',
                'sound': 'default',
                'image': url || '',
            },
            'priority': 10,
            'timeToLive': 10,
            'data': {
                'url': `${keys.host}/${slug}`
            }
        }
    
        sendPushRequest('android', JSON.parse(JSON.stringify(postData)));
        sendPushRequest('ios', JSON.parse(JSON.stringify(postData)));
    }
    catch (err) {
        if(keys.debug) console.log(err);
    }
}

module.exports = {
    createMovie,
    getMovies,
    searchMovies,
    checkSlug,
    getMoviesCount,
    getMovieBySlug,
    updateMovieBySlug,
    deleteMovieBySlug,
    notifyMovieUpdate
}