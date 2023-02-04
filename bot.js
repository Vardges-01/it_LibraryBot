const { Telegraf } = require('telegraf')
const keyboard = require("./markup/keyboard")
const inlineKeyboard = require("./markup/inline_keyboard")
const config = require('config');
const languages = require('./helpers/languages.json')
const db = require('./helpers/db')
const bot = new Telegraf(config.get("token"), {
    polling: true
});

let subjects_list = []

try {
    bot.start(async (ctx) => {
        const tgUser_id = ctx.message.from.id;

        db.setMode(tgUser_id, "login");
        ctx.telegram.sendMessage(ctx.chat.id, languages["en"].selectBotLanguage, {
            reply_markup: {
                inline_keyboard: inlineKeyboard.userLanguages()
            }
        })
    })

    bot.help((ctx) => ctx.reply('Send me a sticker')) //ответ бота на команду /help

    // Keyboards
    bot.on("text", async (ctx, next) => {
        let user = (await db.getUser(ctx.from))[0];
        if (user) {
            let keyboards = keyboard.getKeyboardValues(user.role, user.lang);
            if (ctx.message.text == keyboards.books) {
                db.setMode(user.tg_id, "books");
                subjects_list = await db.getSubjectNames();
                let inKeyboard = inlineKeyboard.subjects(subjects_list)

                ctx.telegram.sendMessage(ctx.chat.id, `${languages[user.lang].selectSubject}\n\n`, {
                    reply_markup: {
                        inline_keyboard: inKeyboard
                    }
                });
            }
            else if (ctx.message.text === keyboards.search) {
                db.setMode(user.tg_id, "search");
                ctx.reply(languages[user.lang].searchBook)
            }
            else if (ctx.message.text === keyboards.offerBook) {
                db.setMode(user.tg_id, "offer_book");
            }
            else if (ctx.message.text === keyboards.addBook) {
                db.setMode(user.tg_id, "add_book");
                ctx.reply("Send Document with Camption` \n(subject / name / author / year / language )")
            } else {
                next()
            }

        }
        else {
            next();
        }

    })

    bot.on("text", async (ctx) => {
        const tgUser_id = ctx.message.from.id;
        let user = (await db.getUser(ctx.from))[0];
        let mode = await db.getMode(tgUser_id)

        if (mode === 'search') {
            book_list = await db.getBooks(false, ctx.message.text)
            if (book_list.length) {
                let inKeyboard = inlineKeyboard.books(book_list)
                await ctx.telegram.sendMessage(ctx.chat.id, `${languages[user.lang].selectBook}\n\n` + inKeyboard.book_titles, {
                    reply_markup: {
                        inline_keyboard: inKeyboard.result
                    }
                });

                db.setMode(tgUser_id, "books");

            } else {
                ctx.reply(`Found ${book_list.length} books 😔`)
            }

        }
        else {
            ctx.reply("Please Select what you want to do?")
        }
    })

    bot.on('document', async (ctx) => {
        const tgUser_id = ctx.message.from.id;
        let book_id = "";
        let file_id = ctx.message.document.file_id;
        let mode = await db.getMode(tgUser_id);
        if (mode.includes("/")) {

            [mode, book_id] = mode.split("/")
        }

        if (mode === 'add_book') {
            if (ctx.message.caption.length) {
                await db.insertBook(ctx.message.caption, file_id)
                ctx.reply("Book Uploaded")
            }
            else {
                ctx.reply('Failed book upload!\nPlease add book info')
            }
        }
        if (mode == "update_book") {

            if (config.books["languages"].includes(ctx.message.caption)) {
                await db.updatetBook({ lang: ctx.message.caption, book_id }, file_id)
                ctx.reply("Book Updated")
            }
            ctx.reply("Unsuported language")

        }
    })

    bot.on('callback_query', async (ctx) => {
        try {
            const { chat, message_id } = ctx.callbackQuery.message;
            const tgUser_id = chat.id;
            let book_list = []
            let user = (await db.getUser(ctx.from))[0];
            let cbqData = ctx.callbackQuery.data;

            let mode = await db.getMode(tgUser_id);
            // Explicit usage
            if (mode == 'books') {
                let buttonData = cbqData.includes("/") ? cbqData.split('/') : cbqData;

                // Book List
                if (!Array.isArray(buttonData) && subjects_list.includes(buttonData)) {
                    book_list = await db.getBooks({
                        subject: buttonData
                    })
                    let inKeyboard = inlineKeyboard.books(book_list)
                    ctx.editMessageText(`${languages[user.lang].selectBook}\n\n` + inKeyboard.book_titles, {
                        chat_id: chat.id,
                        message_id: message_id,
                        inline_message_id: null,
                        reply_markup: {
                            inline_keyboard: inKeyboard.result
                        }
                    });
                    ctx.answerCbQuery()

                }

                if (Array.isArray(buttonData)) {
                    // Language list
                    if (!isNaN(buttonData[1])) {
                        let subject = buttonData[0]
                        let index = buttonData[1]

                        book_list = await db.getBooks({
                            subject
                        });

                        ctx.editMessageText(languages[user.lang].selectLanguage, {
                            chat_id: chat.id,
                            message_id: message_id,
                            inline_message_id: null,
                            reply_markup: {
                                inline_keyboard: inlineKeyboard.languages(book_list[index], user.role)
                            }
                        })

                        ctx.answerCbQuery('done')


                    }

                    // add Language
                    else if (buttonData[0] == "add_lang") {
                        let book_id = buttonData[1]
                        db.setMode(user.tg_id, "update_book" + "/" + book_id);

                        ctx.reply("Send Document with Camption` \n( language )")
                    }

                    // Send Book
                    else {
                        let book_lang = buttonData[0]
                        let book_id = buttonData[1]

                        book_list = await db.getBooks({
                            id: book_id
                        })

                        await ctx.telegram.sendDocument(ctx.chat.id, book_list[0][`${book_lang}_address`], { caption: `${book_list[0].name} / ${book_list[0].author} / ${book_list[0].year}` }).then(() => console.log("file sent"));
                        await ctx.telegram.deleteMessage(chat.id, message_id);
                        ctx.answerCbQuery()

                    }
                }
            }



            else if (mode == 'login') {
                let lang = cbqData
                let updateReslut = {}
                if (!user) {
                    user = await db.insertUser(ctx.from, lang)
                }
                else if (user.lang !== lang) {
                    // update user language
                    updateReslut = await db.updateUser({
                        user: ctx.from,
                        lang: lang
                    })
                }

                const welcomText = languages[lang].welcomeMsg

                if (user || updateReslut.acknowledged) {
                    ctx.telegram.sendMessage(ctx.chat.id, welcomText, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            keyboard: keyboard[user.role][lang],
                            resize_keyboard: true
                        }
                    })
                }
                ctx.answerCbQuery('done')

            }

            else {
                ctx.reply("Please Select what you want to do?")
            }
        } catch (error) {
            console.log(error)
        }
    })

    bot.launch() // запуск бота

} catch (error) {
    console.log(error);
}