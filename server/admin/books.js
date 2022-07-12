const Book = require('../models/Book');
const keys = require('../keys');
const fetch = require('node-fetch');
const escapeRegexp = require('escape-string-regexp-node');


const createBook = async (data) => {
    try {
        const book = await Book.create(data);
        return book;
    }
    catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const getBooks = async (page = 1, limit = 10) => {
    try {
        const books = await Book.paginate(
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

        if(books) {
            const { docs, totalDocs } = books;

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

        return books;
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
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
            'title slug image published views date',
            {
                populate: 'image',
                lean: {virtuals: true}
            }
        )
        
        if(books) {
            return books.map(book => {
                const {episodes, image, ...rest} = book;

                return {
                    ...rest,
                    image: image.resize
                }
            })
        }

        return books
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getBookBySlug = async (slug) => {
    try {
        const book = await Book.findOne(
            { slug: slug },
            '-__v -chapters.obfuscated',
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
        .lean({getters: true})

        return book;
    }
    catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const updateBookBySlug = async (slug, data) => {
    try {
        const book = await Book.findOneAndUpdate(
            {slug: slug},
            data,
            {
                runValidators: true,
                context: 'query',
                returnDocument: 'after',
                lean: {virtuals: true}
            }
        );
        return book;
    }
    catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const deleteBookBySlug = async (slug) => {
    try {
        const book = await Book.findOneAndDelete({slug: slug})
        return book
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getBooksCount = async () => {
    try {
        const count = await Book.estimatedDocumentCount();
        return count
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return 0;
    }
}

async function checkSlug(slug)  {
    try {
        const existed = await Book.exists({ slug: slug });
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
                    post_message: 'Chap mới đó! Đi coi bede, đi coi bede kìa :))',
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

const notifyBookUpdate = async (data) => {
    try {
        let { title, image, slug } = data;
        const { url } = image || {};

        const postData = {
            'collapse_key': 'type_a',
            'notification': {
                'title': title,
                'body': 'Chap mới đó! Đi coi bede, đi coi bede kìa :))',
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
    createBook,
    getBooks,
    searchBooks,
    checkSlug,
    getBooksCount,
    getBookBySlug,
    updateBookBySlug,
    deleteBookBySlug,
    notifyBookUpdate: notifyBookUpdate
}