const { CronJob } = require('cron');
const { getRedisClient } = require('../configs/database');
const { getCurrentKey } = require('../client/counter')
const { regenerateSitemap } = require('./sitemap');
const keys = require('../keys');
const redis = getRedisClient();
const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const weekday = require('dayjs/plugin/weekday');
dayjs.extend(isSameOrBefore);
dayjs.extend(weekday);

const Movie = require('../models/Movie');
const Book = require('../models/Book');

var isThisWeek, isThisMonth;


const updateWeekend = () => {
    const thisSunday = dayjs().startOf("date").weekday(7).hour(23).minute(59).toDate();
    redis.HSET('views+rating', 'weekend', thisSunday);
}

const updateMonth = () => {
    const thisMonth = dayjs().month() + 1;
    redis.HSET('views+rating', 'month', thisMonth);
}

const resetKey = (type) => {
    const typeList = ['book', 'movie'];
    if(!typeList.includes(type)) return;

    redis.HSET('views+rating', type, 0)
}

const updateSingle = async (hash, type, hashName) => {
    if(!hash || !type || !hashName) return;
    
    const [id, value] = hash;
    
    if(id === 'undefined') {
        await redis.HDEL(hashName, id)
        return;
    }
    
    
    if(!id || !value) return;
    
    const values = value.split(':');
    const views = Number(values[0]) || 0;
    const rating = Number(values[1]) || 0;

    try {
        const Model = type === 'movie' ? Movie : Book;
        const item = await Model.findById(id, 'views rating');
    
        if(item) {
            const { weekly, monthly, total } = item.views;
            const { guest, yu } = item.rating;
    
            const getWeekViews = () => {
                if(isThisWeek && weekly > 0) {
                    return views + weekly;
                }
    
                return views;
            }
    
            const getMonthViews = () => {
                if(isThisMonth && monthly > 0) {
                    return views + monthly;
                }
    
                return views;
            }
            
            const getRating = () => {
                if(guest > 0 && rating > 0) {
                    const average = (guest + rating) /2
                    return average.toFixed(1);
                }
    
                return guest;
            }
    
            const updated = await item.updateOne({
                views: {
                    weekly: getWeekViews(),
                    monthly: getMonthViews(),
                    total: total + views
                },
                rating: {
                    guest: getRating(),
                    yu
                }
            }, { lean: true })
            
            if(updated) await redis.HDEL(hashName, id)
        }
    } catch (err) {
        if(keys.debug) console.log(err);
    }
}

const updateModelViewsRating = async (type) => {
    try {
        const typeList = ['book', 'movie'];
        if(!typeList.includes(type)) return;

        const key = await getCurrentKey(type);

        for(let i = 0; i === key; i++) {
            const hashName = `views+rating:${type}:${i}`;
            const hash = await redis.HGETALL(hashName);

            Object.entries(hash).forEach(
                (entry) => updateSingle(entry, type, hashName)
            )
        }

        resetKey(type);
    }
    catch (err) {
        if(keys.debug) console.log(err);
    }
}

const updateViewsRating = async () => {
    console.log('Cron started');

    try {
        const [weekend, month] = await Promise.all([
            getCurrentKey('weekend'),
            getCurrentKey('month'),
        ])
        
        const thisMonth = dayjs().month() + 1;
        isThisWeek = dayjs().isSameOrBefore(dayjs(weekend));
        isThisMonth = thisMonth === Number(month);

        if(!isThisWeek) updateWeekend();
        if(!isThisMonth) updateMonth();

        updateModelViewsRating('movie');
        updateModelViewsRating('book');
    }
    catch (err) {
        if(keys.debug) console.log(err);
    }
}

const viewsRating = new CronJob('0 0/15 * * * *', updateViewsRating, null);
const sitemap = new CronJob('0 0 0 * * 1', regenerateSitemap, null);


module.exports = {
    viewsRating,
    sitemap
}