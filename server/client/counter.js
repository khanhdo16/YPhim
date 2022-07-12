const { getRedisClient } = require('../configs/database');
const keys = require('../keys');
const redis = getRedisClient();
const dayjs = require('dayjs');
const weekday = require('dayjs/plugin/weekday')
dayjs.extend(weekday)



const getCurrentKey = async (type) => {
    try {
        const typeList = ['book', 'movie', 'weekend', 'month'];
        if(!typeList.includes(type)) return;

        const key = await redis.HGET('views+rating', type);
        
        if(type === 'weekend' || type === 'month') {
            if(key) return key;

            if(type === 'weekend') {
                const thisSunday = dayjs().startOf("date").weekday(7).hour(23).minute(59).toDate();

                await redis.HSET('views+rating', type, thisSunday)
                return thisSunday;
            }

            if(type === 'month') {
                const thisMonth = dayjs().month() + 1;

                await redis.HSET('views+rating', type, thisMonth)
                return thisMonth;
            }
        }
        
        if(key != null && key >= 0) return Number(key);

        await redis.HSET('views+rating', type, 0)
        return 0;
    }
    catch(err) {
        if(keys.debug) console.log(err);
    }
}

const getCurrentHashName = async (type) => {
    try {
        if(type !== 'book' && type !== 'movie') return;
        const key = await getCurrentKey(type);
        const hashName = (type, key) => `views+rating:${type}:${key}`;

        const length = await redis.HLEN(hashName(type, key));
        if(length <= 500) return hashName(type, key);

        const newKey = await redis.HINCRBY('views+rating', type, 1);
        return hashName(type, newKey);
    } catch (err) {
        if(keys.debug) console.log(err);
    }
}

const incrementView = async (type, id) => {
    if(!type || !id) return;

    try {
        const hashName = await getCurrentHashName(type);
        if(!hashName) return;

        const value = await redis.HGET(hashName, id);
        if(value) {
            const [views, rating] = value.split(':');

            await redis.HSET(hashName, id, `${Number(views) + 1}:${rating}`);
            return;
        }

        await redis.HSET(hashName, id, '1:0');
        return;
    }
    catch(err) {
        if(keys.debug) console.log(err);
    }
}

const setRating = async (type, id, value) => {
    if(!type || !id || !value) return;

    const max = 5;
    const int = Number(value) || 0;
    const newRating = int <= max ? int : max;

    try {
        const hashName = await getCurrentHashName(type);
        if(!hashName) return;

        const value = await redis.HGET(hashName, id);

        if(value) {
            const [views, rating] = value.split(':');
            const currRating = Number(rating);
            let average = 0;
            
            if(currRating === 0) average += newRating;
            if(currRating > 0) average = (currRating + newRating) /2;

            await redis.HSET(hashName, id, `${views}:${average.toFixed(1)}`);
            return;
        }

        await redis.HSET(hashName, id, `0:${newRating}`);
        return;
    }
    catch(err) {
        if(keys.debug) console.log(err);
    }
}

module.exports = {
    incrementView,
    setRating,
    getCurrentKey
}