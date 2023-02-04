const kb = require("./keyboard-button")

module.exports = {

    user: {
        en: [
            [kb.user.en.books, kb.user.en.search],
            [kb.user.en.offerBook]
        ],
        ru: [
            [kb.user.ru.books, kb.user.ru.search],
            [kb.user.ru.offerBook]
        ],
        hy: [
            [kb.user.hy.books, kb.user.hy.search],
            [kb.user.hy.offerBook]
        ]
    },
    admin: {
        en: [
            [kb.admin.en.books, kb.admin.en.search],
            [kb.admin.en.addBook]
        ],
        ru: [
            [kb.admin.ru.books, kb.user.ru.search],
            [kb.admin.ru.addBook]
        ],
        hy: [
            [kb.admin.hy.books, kb.admin.hy.search],
            [kb.admin.hy.addBook]
        ]
    },
    getKeyboardValues(role, lang) {
        return kb[role][lang];
    }

}