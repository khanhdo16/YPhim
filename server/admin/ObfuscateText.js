class ObfuscateText {
    #abc;
    #randText;
    #randAlpha;
    #generate;
    #hiddenElements;
    #visibleElements;
    #obfuscatedElements;
    #span;
    #space;
    #rand;
    #randStrGenerator;
    #randItem;
    #createKlasses;


    constructor(text) {
        this.text = text;
        this.#abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        this.#rand = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        this.#randStrGenerator = (range) => {
            return (length) => {
                let text = "";
        
                for (let i = 0; i < length; i++) {
                    text += range.charAt(this.#rand(0, range.length - 1));
                }
        
                return text;
            };
        }

        this.#randText = this.#randStrGenerator(this.#abc);
        this.#randAlpha = this.#randStrGenerator(this.#abc + "0123456789");

        this.#generate = (amount) => {
            const arr = new Array(amount);
    
            for (let i = 0; i < arr.length; i++) {
                arr[i] = this.#randText(5);
            }
    
            return arr;
        }

        this.#hiddenElements = this.#generate(5);
        this.#visibleElements = this.#generate(5);
        this.#obfuscatedElements = [];

        this.#span = (text, className) => {
            return (
                `<span class='${className}'>
                    ${text}
                </span>`
            )
        }

        this.#space = () => {
            return '<span> </span>';
        }
        
        this.#randItem = (items) => {
            const index = Math.floor(Math.random() * items.length);
            return items[index];
        };
        
        this.#createKlasses = (elements, props) => {
            return elements.map((klass) => {
                return (
                    `.${klass} {
                        ${props}
                    }`
                )
            });
        }
    }
    
    
    getInlineStyle = () => {
        const hidden = "display: none;";
        const visible = "display: inline-block;";
    
        const styleArray = [
            ...this.#createKlasses(this.#hiddenElements, hidden),
            ...this.#createKlasses(this.#visibleElements, visible),
        ];
    
        const styles = styleArray.join('\n');
    
        return styles
    }

    getObfuscatedText = () => {
        if(this.text.length === 0) {
            return {
                style: '',
                text: ''
            }
        }

        const wordsFromText = this.text.split(' ');
        let filledArray;

        const fillRandomSpan = () => {
            const fillAmount = this.#rand(1, 2);
            let tempArray = [];

            for (let j = 0; j < fillAmount; j++) {
                const txt = this.#randAlpha(2);
                const className = this.#randItem(this.#hiddenElements);
                tempArray.push(this.#span(txt, className));
            }

            return tempArray;
        }

        if(wordsFromText.length <= 10) {
            const randomArray = fillRandomSpan();

            filledArray = [
                this.text,
                ...randomArray
            ]
        }

        if(!filledArray) {
            filledArray = [];

            for(let i = 0; i < wordsFromText.length; i++) {
                const limit = 10;
                const isDivisibleByLimit = i > 0 && (i % limit === 0);
                const last = i === (wordsFromText.length - 1);

                if((wordsFromText[i] === '' || !isDivisibleByLimit) && !last) {
                    filledArray.push(`${wordsFromText[i]} `);
                    continue;
                }

                const randomArray = fillRandomSpan();

                filledArray = [
                    ...filledArray,
                    wordsFromText[i],
                    !last ? this.#space() : '',
                    ...randomArray
                ]
            }
        }
    
        return {
            style:  this.getInlineStyle(),
            text:   filledArray.join('')
        }
    }
}

module.exports = { ObfuscateText };