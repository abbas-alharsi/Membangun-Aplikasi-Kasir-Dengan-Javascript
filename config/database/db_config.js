const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./system/db/mycashier.db')
module.exports = db