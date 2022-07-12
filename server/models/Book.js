const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const mongooseLeanGetters = require('mongoose-lean-getters');
const { Schema, Types } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');
const mongoosePaginate = require('mongoose-paginate-v2');
const slugify = require('slugify');
const { obfuscateChapter } = require('../admin/chapter-obfuscator')
const { readFileSync } = require('fs');



const chapterSchema = new mongoose.Schema({
    _id: Types.ObjectId,
    name: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        get: (value) => {
            return readFileSync(value).toString();
        }
    },
    obfuscated: String,
    image: {
        type: Schema.Types.ObjectId,
        ref: 'Image',
    },
    music: {
        type: Schema.Types.ObjectId,
        ref: 'Audio',
    }
})

chapterSchema.plugin(mongooseLeanGetters);


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


const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
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
    chapters: {
        type: [chapterSchema],
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


bookSchema.virtual('latest')
    .get(function() {
        const chapters = this.chapters;

        if(Array.isArray(chapters)) {
            if(chapters.length === 1) return chapters[0].name
            if(chapters.length > 1) return chapters[chapters.length - 1].name
        }

        return ''
    })


bookSchema.pre(['save', 'findOneAndUpdate'], async function() {
    const title = this.get('title')
    const chapters = this.get('chapters');

    if(title) {
        const normalizedTitle = slugify(title, {
            locale: 'vi',
            lower: true,
            replacement: ' '
        })
    
        this.set('search', normalizedTitle)
    }

    if(chapters) {
        const isUpdate = this._update;
        const clonedChap = JSON.parse(JSON.stringify(chapters));
        let obfuscated;

        if(isUpdate) {
            try {
                const { slug } = this.getFilter();
                const { _id, chapters } = await this.model.findOne(
                    {slug},
                    'chapters',
                    { lean: true}
                ) || {};

                if(!_id || !chapters) throw new Error('Invalid id and chapters');

                const ids = chapters.map(chap => {
                    if(chap._id) return chap._id;

                    return new Types.ObjectId();
                });
                
                obfuscated = obfuscateChapter(clonedChap, _id, ids);

                delete this._update.chapters;
            }
            catch(err) {
                throw new Error(err);
            }
        }
        else {
            const _id = new Types.ObjectId();
            const ids = chapters.map(() => new Types.ObjectId());
            obfuscated = obfuscateChapter(clonedChap, _id, ids);
            
            delete this.chapters;
            this.set('_id', _id);
        }
        
        if(!obfuscated) throw new Error('Unable to save chapters')

        this.set('chapters', obfuscated)
    }
}) 

bookSchema.plugin(uniqueValidator);
bookSchema.plugin(mongooseLeanVirtuals);
bookSchema.plugin(mongooseLeanGetters);
bookSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('Book', bookSchema)