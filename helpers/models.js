const config = require('config');
const mongoose = require('mongoose');
const db = mongoose.connect(config.get("DB_url"))
    .then(() => { console.log("DB Connect") })
    .catch(err => { console.log(err) })

var users = mongoose.model("users", mongoose.Schema({
    username: { type: String },
    name: { type: String },
    tg_id: { type: String },
    role: { type: String },
    lang: { type: String },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt' }, versionKey: false }));

var books = mongoose.model("books", mongoose.Schema({
    name: { type: String },
    author: { type: String },
    year: { type: String },
    subject: { type: String },
    en_address: { type: String, default: null },
    ru_address: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'createdAt' }, versionKey: false }));

module.exports = {
    users,
    books
}