const Settings = require('../models/Settings');
const keys = require('../keys');

const getFav = async () => {
    try {
        let { fav } = await Settings.findById(
            'settings',
            'fav',
        )
        .populate({
            path: 'fav',
            select: '_id title slug image',
            populate: 'image'
        })
        .lean({virtuals: true}) || {}

        if(fav) {
            const { image, ...rest} = fav;

            fav = {
                ...rest,
                image: image.resize
            }
        }

        return fav;
    }
    catch(err) {
        if(keys.debug) console.log(err);
        return null
    }
}

const getAnnouncement = async () => {
    try {
        const { announcement } = await Settings.findById(
            'settings',
            'announcement',
            {lean: {virtuals: true}}
        ) || {}
    
        return announcement;
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return null;
    }
}

const getAds = async () => {
    try {
        const ads = await Settings.findById(
            'settings',
            '-__v -announcement -facebook -fav -popup -sitemap',
            {lean: {virtuals: true}}
        ) || {}
    
        return ads;
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return null;
    }
}

const getPopup = async () => {
    try {
        const { popup } = await Settings.findById(
            'settings',
            'popup',
            {lean: {virtuals: true}}
        ) || {}
    
        return popup;
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return null;
    }
}

const getFacebook = async () => {
    try {
        const { facebook } = await Settings.findById(
            'settings',
            'facebook',
            {lean: {virtuals: true}}
        ) || {}
    
        return facebook;
    }
    catch(err) {
        if(keys.debug) console.log(err);;
        return null;
    }
}

module.exports = {
    getFav,
    getAnnouncement,
    getAds,
    getPopup,
    getFacebook
}