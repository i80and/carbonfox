import * as util from './util.js'

class GeneratorDict {
    constructor() {
        this.words = []
    }

    load(path, language) {
        return self.fetch(path).then((response) => {
            return response.text()
        }).then((response) => {
            this.words = response.split('\n')
            if(this.words[this.words.length-1] === '') {
                this.words.pop()
            }

            this.language = language
        })
    }

    getWord() {
        return util.pick(this.words)
    }
}

const defaultLanguage = 'en'
const theDict = new GeneratorDict()

export function init(lang) {
    if(theDict.words.length === 0) {
        if(lang === undefined) {
            const currentLanguage = self.navigator.language

            // Exclude the extended language subtags
            const code = /([a-z]{2,})-?/.exec(currentLanguage)
            if(code === null) {
                lang = defaultLanguage
            } else {
                lang = code[1]
            }
        }

        return theDict.load(`/dicts/${lang}.dict`, lang).catch((err) => {
            // If a non-english language has failed to load, try to load the
            // english dictionary as a fallback.
            if(lang === defaultLanguage) {
                throw err
            }

            return init(defaultLanguage)
        })
    } else {
        return new Promise((resolve) => resolve())
    }
}

export function getWord() {
    return theDict.getWord()
}
