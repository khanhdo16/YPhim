const Settings = require('../models/Settings')
const keys = require('../keys');

const getAnnouncement = async () => {
    try {
        const announcement = await Settings.findById(
            'settings',
            'announcement',
            {lean: true}
        )
    
        return announcement;
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return null;
    }
}

const setAnnouncement = async (announcement) => {
    try {
        const update = await Settings.findByIdAndUpdate(
            'settings',
            announcement,
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

const getAds = async () => {
    try {
        const ads = await Settings.findById(
            'settings',
            '-__v -announcement -facebook -fav -sitemap',
            {lean: true}
        )
    
        return ads;
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return null;
    }
}


const setAds = async (ads) => {
    try {
        const update = await Settings.findByIdAndUpdate(
            'settings',
            ads,
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
        if(keys.debug) console.log(err);;
        return null;
    }
}

const getFav = async () => {
    try {
        const fav = await Settings.findById(
            'settings',
            'fav',
            { lean: true }
        )

        return fav;
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return null;
    }
}

const setFav = async (id) => {
    try {
        const update = await Settings.findByIdAndUpdate(
            'settings',
            {fav: id},
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
        if(keys.debug) console.log(err);;
        return null;
    }
}

const getFacebook = async () => {
    try {
        const facebook = await Settings.findById(
            'settings',
            'facebook',
            {lean: true}
        )
    
        return facebook;
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return null;
    }
}

const setFacebook = async (facebook) => {
    try {
        const update = await Settings.findByIdAndUpdate(
            'settings',
            facebook,
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

module.exports = {
    announcement: {
        get: getAnnouncement,
        set: setAnnouncement
    },
    ads: {
        get: getAds,
        set: setAds
    },
    fav: {
        get: getFav,
        set: setFav
    },
    facebook: {
        get: getFacebook,
        set: setFacebook
    }
}