module.exports = {
    subjects(subjects) {
        let result = []
        for (sub of subjects) {
            result.push([{ text: sub, callback_data: sub }])
        }
        return result;
    },

    books(books_info) {
        let result = []
        let tmp = []
        let book_titles = "";
        for (index in books_info) {
            book_titles += `${parseInt(index) + 1}) ${books_info[index].name} (${books_info[index].author}, ${books_info[index].year})\n\n`
            tmp.push({ text: parseInt(index) + 1, callback_data: books_info[index].subject + "/" + index })
            if (index + 1 == 4) {
                result.push(tmp)
                tmp = [];
            }
        }

        if (tmp.length) {
            result.push(tmp);
            tmp = [];
        }

        return { result, book_titles };

    },

    languages(book_info, user_role) {
        let result = []

        if (book_info.en_address) {
            result.push({ text: "En 🇺🇸", callback_data: "en" + "/" + book_info._id })
        }
        if (book_info.ru_address) {
            result.push({ text: "Rus 🇷🇺", callback_data: "ru" + "/" + book_info._id })
        }
        if (user_role == "admin") {
            result.push({ text: "add language", callback_data: "add_lang" + "/" + book_info._id })
        }

        return [result]
    },

    userLanguages() {
        let result = [
            { text: "En 🇺🇸", callback_data: "en" },
            { text: "Ru 🇷🇺", callback_data: "ru" },
            { text: "Hy 🇦🇲", callback_data: "hy" }
        ]
        return [result];
    }
}