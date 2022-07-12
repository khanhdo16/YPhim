const Movie = require('../models/Movie');
const Book = require('../models/Book');
const { SitemapStream, streamToPromise } = require('sitemap')
const { Readable } = require('stream')
const keys = require('../keys');
const Settings = require('../models/Settings');


const countries = {
    'thai-lan': 'Thái Lan',
    'dai-loan': 'Đài Loan',
    'han-quoc': 'Hàn Quốc',
    'trung-quoc': 'Trung Quốc',
    'nhat-ban': 'Nhật Bản',
    'phillipines': 'Phillipines',
    'hong-kong': 'Hong Kong'
}

const getLinks = async () => {
    try {
        const [movies, books] = await Promise.all([
            Movie.find().select('-_id slug').lean(),
            Book.find().select('-_id slug').lean()
        ]);

        const movieURLs = movies.map(({slug}) => {
            return {
                url: `/${slug}`,
                changefreq: 'weekly',
                priority: 0.8
            }
        });

        const bookURLs = books.map(({slug}) => {
            return {
                url: `/${slug}`,
                changefreq: 'weekly',
                priority: 0.8
            }
        });

        return [
            ...movieURLs,
            ...bookURLs
        ]
    }
    catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const getCountryLinks = () => {
    return Object.keys(countries).map(country => {
        return {
            url: `/quoc-gia/${country}`,
            changefreq: 'monthly',
            priority: 0.5
        }
    })
}

const generateSitemap = async () => {
    try {
        const postURLs = await getLinks();
        const countryURLs = getCountryLinks();
        const URLs = [
            {
                url: '/',
                changefreq: 'daily',
                priority: 1
            },
            ...postURLs ? postURLs : [],
            ...countryURLs
        ]
    
        const stream = new SitemapStream({ hostname: keys.host })
        const sitemap = await streamToPromise(Readable.from(URLs).pipe(stream))
    
        return sitemap.toString();
    } catch (err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const setSitemap = async (sitemap) => {
    try {
        const update = await Settings.findByIdAndUpdate(
            'settings',
            sitemap,
            {
                runValidators: true,
                context: 'query',
                returnDocument: 'after',
                upsert: true,
                lean: true,
            }
        )
    
        return update;
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null;
    }
}

const regenerateSitemap = async () => {
    try {
        const sitemap = await generateSitemap();
        if(sitemap) setSitemap({sitemap});
    }
    catch (err) {
        if(keys.debug) console.log(err);
    }
}

const getSitemap = async () => {
    try {
        let { sitemap } = await Settings.findById(
            'settings',
            'sitemap',
            { lean: true }
        ) || {}

        if(sitemap) return sitemap;
            
        sitemap = await generateSitemap();

        if(sitemap) {
            setSitemap({sitemap});
            return sitemap;
        }
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null;
    }
}



module.exports = { getSitemap, regenerateSitemap }