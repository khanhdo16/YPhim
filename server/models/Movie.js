const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const uniqueValidator = require('mongoose-unique-validator')
const mongoosePaginate = require('mongoose-paginate-v2');
const slugify = require('slugify');
const { parseDocument } = require("htmlparser2");


const serverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    }
})

const episodeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    servers: {
        type: [serverSchema],
        required: true
    }
})

const viewSchema = new mongoose.Schema({
    weekly: Number,
    monthly: Number,
    total: Number
})

const ratingSchema = new mongoose.Schema({
    guest: {
        type: Number,
        max: 5,
    },
    yu: {
        type: Number,
        max: 5,
    }
})

ratingSchema.virtual('total')
    .get(function() {
        if(this.yu === 0 && this.guest === 0) return 0;
        
        if(this.yu === 0 && this.guest > 0) {
            if(this.guest % 1 === 0) return this.guest.toFixed(1);
            return this.guest.toFixed(2);
        }

        if(this.guest === 0 && this.yu > 0) {
            if(this.yu % 1 === 0) return this.yu.toFixed(1);
            return this.yu.toFixed(2);
        }
        
        const yuRating = (this.yu * 100 / 5) * 4 / 100;
        const guestRating = (this.guest * 100 / 5) * 1 / 100;
        const average = guestRating + yuRating;
        
        if(average % 1 === 0) return average.toFixed(1);
        return average.toFixed(2);
    })

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    search: String,
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    note: String,
    image: {
        type: Schema.Types.ObjectId,
        ref: 'Image',
        required: true
    },
    country: {
        type: String,
        required: true,
        index: true
    },
    episodes: {
        type: [episodeSchema],
        required: true
    },
    published: {
        type: Boolean,
        default: true,
        index: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: new Date()
    },
    views: {
        type: viewSchema,
        default: {
            weekly: 0,
            monthly: 0,
            total: 0
        }
    },
    rating: {
        type: ratingSchema,
        default: {
            guest: 0,
            yu: 0
        }
    }
})

movieSchema.virtual('latest')
    .get(function() {
        const episodes = this.episodes;

        if(Array.isArray(episodes)) {
            if(episodes.length === 1) return episodes[0].name
            if(episodes.length > 1) return episodes[episodes.length - 1].name
        }

        return ''
    })


const getIframeSource = (link) => {
    const { children: elements } = parseDocument(link);
    const iframe = elements.find(el => el.name === 'iframe');
    const { src } = iframe.attribs || {}

    if(src) return src;

    return null
}

const getOKRuSource = (link) => {
    const [, videoId] = link.match(/(?:video|videoembed)\/(\d+)/);

    if(videoId) return `https://vidcdn.pp.ua/?sv=okr&id=${Number(videoId) + 12345}`;

    return null;
}

const getVKSource = (link) => {
    const [, videoId] = link.match(/(?:video.+_|video_ext\.php.+id=)(\d+)/);

    if(videoId) return `https://vidcdn.pp.ua/?sv=vk&id=${Number(videoId) + 12345}`;

    return null;
}

const get1fichierSource = (link) => {
    const videoId = link.split(/\?|&/g)[1];
    if(videoId) return `http://huntingbrowser.ga/e/a.html?file=/fch/get.php?code=${videoId}`;
}

const refineServers = (servers) => {
    return servers.map(server => {
        if(!server) return server;

        const { name, type, link } = server;

        if(type !== 'embed') return server;


        const isIframe =  link.includes('iframe');
        const isOKRu = link.startsWith('https://ok.ru');
        const isVK = link.startsWith('https://vk.com');
        const is1fichier = link.startsWith('https://1fichier.com');
        let src;

        if(isIframe) src = getIframeSource(link);
        if(isOKRu) src = getOKRuSource(link);
        if(isVK) src = getVKSource(link);
        if(is1fichier) src = get1fichierSource(link);

        if(src) return {
            name,
            type,
            link: src
        }

        return server;
    })
}


movieSchema.pre(['save', 'findOneAndUpdate'], function(next) {
    const title = this.get('title')
    const episodes = this.get('episodes');
    
    if(title) {
        const normalizedTitle = slugify(title, {
            locale: 'vi',
            lower: true,
            replacement: ' '
        })
    
        this.set('search', normalizedTitle)
    }

    if(episodes) {
        const isValidArray = Array.isArray(episodes) && episodes.length > 0;

        if(isValidArray) {
            const isUpdate = this._update;
            const newEpisodes = episodes.map(ep => {
                const { name, servers } = ep;
                const newServers = refineServers(servers);

                return {
                    name,
                    servers: newServers
                }
            })

            if(isUpdate) delete this._update.episodes;
            delete this.episodes;

            this.set('episodes', newEpisodes)
        } 
    }

    next();
}) 

movieSchema.plugin(uniqueValidator);
movieSchema.plugin(mongooseLeanVirtuals);
movieSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Movie', movieSchema)