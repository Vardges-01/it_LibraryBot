const { users, books } = require('./models')
const config = require("config");
const redis = require("redis");
const client = redis.createClient({
    url: process.env.REDIS_URL || config.redis_url
});

client.on("error", error => {
    console.log(error);
});

client.on("connect",(err)=>{
    console.log("Redis is connected");
})

client.connect();


module.exports = {
    async insertUser(data, lang) {
        data.lang = lang;
        return users.insertMany(reformat(data))
            .then((res) => { return res })
            .catch(err => console.log(err))
    },
    async getUser(data) {
        return users.find({ "tg_id": data.id })
            .then((res) => { return res })
            .catch(err => console.log(err))
    },
    async updateUser(data) {
        return users.updateOne(...(reformat(data, "userUpdate")))
            .then((res) => { return res })
            .catch(err => console.log(err))
    },
    async insertBook(bookInfo, bookLink) {

        bookInfo = reformat(bookInfo, "bookInsert")
        bookInfo[`${bookInfo.lang}_address`] = bookLink;
        delete bookInfo.lang

        books.insertMany(bookInfo, (err, docs) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Insert Book");
            }
        })
    },

    async updatetBook(bookInfo, bookLink) {
        bookInfo.file_id = bookLink
        bookInfo = reformat(bookInfo, "bookUpdate")

        return books.updateOne(...bookInfo)
        .then((res) => { console.log(res); return res })
        .catch(err => console.log(err))
    },

    async getBooks(param, term) {
        let query = {}

        param.subject? query.subject = param.subject : undefined;
        param.id? query._id = param.id : undefined;
            
        if (term)
            query.name = { $regex: term, $options: 'i' };
            
        return books.find(query).sort("name")
    },

    async getSubjectNames() {
        return await books.distinct("subject");
    },

    async setMode(user, mode) {
        let res = await client.set(`${user}_mode`, mode)
        await client.EXPIRE(`${user}_mode`, 5 * 60)
    },

    async getMode(user) {
        let res =  await client.get(`${user}_mode`)
        return res
    }
}

function reformat(reData, type = "userInsert") {

    let result;
    if (type == "userInsert") {
        result = {
            name: reData.first_name,
            username: reData.username,
            tg_id: reData.id,
            role: "user",
            lang: reData.lang
        }
    }

    if (type == "userUpdate") {
        result = [
            { "tg_id": reData.user.id },
            { "$set": { lang : reData.lang } }
        ]
    }

    // Reformt Book Info
    if (type == "bookInsert") {

        let res = reData.split('/');
        for (i in res) {
            res[i] = res[i].trim()
        }
        result = {
            subject: res[0] || "-",
            name: res[1] || "-",
            author: res[2] || "-",
            year: res[3] || "-",
            lang: res[4] || "-"
        }

    }
    
    if(type == "bookUpdate") {

        result = [
            { "_id": reData.book_id },
            { "$set": { [`${reData.lang}_address`] : reData.file_id } }
        ]
    }

    return result;

}
