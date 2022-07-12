const htmlparser2 = require('htmlparser2');
const { Types } = require('mongoose');
const { ObfuscateText } = require('./ObfuscateText');
const LZString = require('lz-string');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');
const keys = require('../keys');

let processedHtml = '';
let inlineStyle = '';

function onopentag(name, attributes) {
    const attr = Object.entries(attributes).map(([key, value]) => {
        return ` ${key}='${value}'`
    })

    const attrJoined = attr.join('');

    processedHtml += `<${name}${attrJoined}>`
}

function ontext(text) {
    const obfuscator = new ObfuscateText(text);
    const obfuscated = obfuscator.getObfuscatedText();

    inlineStyle += obfuscated.style;
    processedHtml += obfuscated.text;
}

function onclosetag(name) {
    processedHtml += `<${name}>`
}

const obfuscateHtml = (html) => {
    processedHtml = '';

    const parser = new htmlparser2.Parser({ onopentag, ontext, onclosetag })

    parser.write(html);
    parser.end();

    return {
        style: inlineStyle,
        content: processedHtml
    }
}

const obfuscateChapter = (chapters, _id, ids) => {
    const obfuscatedChapters = chapters.map((chap, index) => {
        try {
            const { content, ...rest } = chap;
            const html = obfuscateHtml(content);
            const obfuscated = LZString.compressToUTF16(JSON.stringify(html));

            const documentId = _id instanceof Types.ObjectId ? _id.toString() : _id;
            const chapterPath = path.join(__dirname, '../public/books', documentId);


            if (!existsSync(chapterPath)) {
                mkdirSync(chapterPath, { recursive: true });
            }

            const chapterId = ids[index] instanceof Types.ObjectId ?  ids[index].toString() : ids[index]

            const contentPath = path.join(chapterPath, `${chapterId}_content.txt`);
            const obfuscatedPath = path.join(chapterPath, `${chapterId}_obfuscated.txt`);


            writeFileSync(contentPath, content);
            writeFileSync(obfuscatedPath, obfuscated);

            return {
                _id: chapterId,
                ...rest,
                content: contentPath,
                obfuscated: obfuscatedPath
            }
        }
        catch (err) {
            if (keys.debug) console.log(err)
            throw new Error('Unable to obfuscate chapters')
        }
    })

    return obfuscatedChapters;
}

module.exports = {
    obfuscateChapter
}